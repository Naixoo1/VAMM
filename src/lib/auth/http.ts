import { z } from "zod";
import { AUTH_ERROR_PATH, AUTH_SUCCESS_PATH } from "./config";
import { getAuthRuntime, type AuthRuntime } from "./server";

export interface AccountDTO { configured: boolean; user: null | { name: string; email: string | null }; }
const socialPath = "/api/auth/sign-in/social";
const signOutPath = "/api/auth/sign-out";
const callbackPath = "/api/auth/callback/google";
const MAX_BODY_BYTES = 4096;
const socialSchema = z.object({ provider: z.literal("google"), callbackURL: z.literal(AUTH_SUCCESS_PATH), errorCallbackURL: z.literal(AUTH_ERROR_PATH) }).strict();
const signOutSchema = z.object({}).strict();
const userSchema = z.object({ name: z.string().max(200), email: z.string().email().max(254).nullable().optional(), emailVerified: z.boolean().optional() });

function safeHeaders(source?: Headers): Headers {
  const headers = new Headers({ "Cache-Control": "no-store", Pragma: "no-cache", "X-Content-Type-Options": "nosniff", Vary: "Cookie, Origin" });
  for (const cookie of source?.getSetCookie() ?? []) headers.append("Set-Cookie", cookie);
  return headers;
}
function failure(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status, headers: safeHeaders() });
}
function account(configured: boolean, user: AccountDTO["user"] = null, source?: Headers, status = 200): Response {
  return Response.json({ configured, user } satisfies AccountDTO, { status, headers: safeHeaders(source) });
}
function canonicalRequest(request: Request, runtime: AuthRuntime): boolean {
  const url = new URL(request.url);
  const expected = new URL(runtime.config.origin);
  return url.origin === expected.origin && (!request.headers.has("host") || request.headers.get("host") === expected.host);
}
function sameOrigin(request: Request, runtime: AuthRuntime): boolean {
  return canonicalRequest(request, runtime) && request.headers.get("origin") === runtime.config.origin &&
    !["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "");
}
async function inputBody(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  const length = request.headers.get("content-length");
  if (type !== "application/json" || (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) || !request.body) throw new Error("Invalid auth request.");
  const reader = request.body.getReader(); const decoder = new TextDecoder(); let bytes = 0; let text = "";
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("Auth request too large."); }
      text += decoder.decode(next.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}
function callbackResponse(runtime: AuthRuntime, response?: Response): Response {
  let target = runtime.config.origin + AUTH_ERROR_PATH;
  if (response && response.status >= 300 && response.status < 400) {
    try {
      const location = new URL(response.headers.get("location") ?? "", runtime.config.origin);
      if (location.origin === runtime.config.origin && location.pathname === AUTH_SUCCESS_PATH && !location.search && !location.hash)
        target = runtime.config.origin + AUTH_SUCCESS_PATH;
    } catch { /* Provider/library errors always become the fixed safe return path. */ }
  }
  const headers = safeHeaders(response?.headers); headers.set("Location", target);
  return new Response(null, { status: 302, headers });
}

/** Only these three routes reach the library; raw session/token/account APIs stay private. */
export async function handleAuthRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const callback = url.pathname === callbackPath;
  if (![socialPath, signOutPath, callbackPath].includes(url.pathname)) return failure("AUTH_NOT_FOUND", "This account operation is unavailable.", 404);
  if (request.method !== (callback ? "GET" : "POST")) return failure("METHOD_NOT_ALLOWED", "This account operation does not support that method.", 405);
  let runtime: AuthRuntime | null;
  try { runtime = getAuthRuntime(); } catch { return failure("AUTH_UNAVAILABLE", "Google sign-in is temporarily unavailable. You can continue as a guest.", 503); }
  if (!runtime) return failure("AUTH_UNAVAILABLE", "Google sign-in is not configured. You can continue as a guest.", 503);
  if (!canonicalRequest(request, runtime)) return failure("FORBIDDEN", "This account request is not permitted.", 403);
  if (callback) {
    // Google must navigate cross-site here. The library validates encrypted state, PKCE and identity.
    try { return callbackResponse(runtime, await runtime.auth.handler(request)); }
    catch { return callbackResponse(runtime); }
  }
  if (!sameOrigin(request, runtime)) return failure("FORBIDDEN", "This account request is not permitted.", 403);
  if (url.search) return failure("INVALID_INPUT", "Check the account request and try again.", 400);
  let body: unknown;
  try { body = await inputBody(request); } catch { return failure("INVALID_INPUT", "Send a valid JSON account request.", 400); }
  const parsed = (url.pathname === socialPath ? socialSchema : signOutSchema).safeParse(body);
  if (!parsed.success) return failure("INVALID_INPUT", "Check the account request and try again.", 400);
  try {
    const headers = new Headers(request.headers); headers.delete("content-length");
    const response = await runtime.auth.handler(new Request(url, { method: "POST", headers, body: JSON.stringify(parsed.data) }));
    if (!response.ok) return failure("AUTH_FAILED", "Google sign-in could not be completed. Please try again.", response.status === 429 ? 429 : 502);
    if (url.pathname === signOutPath) return Response.json({ success: true }, { headers: safeHeaders(response.headers) });
    const data = await response.json() as { url?: unknown };
    if (typeof data.url !== "string") throw new Error("Invalid authorization response.");
    const authorization = new URL(data.url);
    if (authorization.origin !== "https://accounts.google.com" || authorization.pathname !== "/o/oauth2/v2/auth" || authorization.username || authorization.password || authorization.hash ||
        authorization.searchParams.get("redirect_uri") !== runtime.config.origin + callbackPath) throw new Error("Invalid authorization destination.");
    return Response.json({ url: authorization.toString(), redirect: true }, { headers: safeHeaders(response.headers) });
  } catch { return failure("AUTH_FAILED", "Google sign-in could not be completed. Please try again.", 502); }
}

export async function handleAccountRequest(request: Request): Promise<Response> {
  if (request.method !== "GET") return account(false, null, undefined, 405);
  let runtime: AuthRuntime | null;
  try { runtime = getAuthRuntime(); } catch { return account(false, null, undefined, 503); }
  if (!runtime) return account(false);
  const origin = request.headers.get("origin");
  if (!canonicalRequest(request, runtime) || (origin !== null && origin !== runtime.config.origin) ||
      ["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "")) return account(true, null, undefined, 403);
  try {
    const sessionRequest = new Request(runtime.config.origin + "/api/auth/get-session", { headers: request.headers });
    const response = await runtime.auth.handler(sessionRequest);
    if (!response.ok) return account(true, null, response.headers, response.status >= 500 ? 503 : 200);
    const data = await response.json() as { user?: unknown } | null;
    const parsed = userSchema.safeParse(data?.user);
    if (!parsed.success) return account(true, null, response.headers);
    return account(true, { name: parsed.data.name.trim() || "Google account", email: parsed.data.emailVerified === true ? parsed.data.email ?? null : null }, response.headers);
  } catch { return account(true, null, undefined, 503); }
}
