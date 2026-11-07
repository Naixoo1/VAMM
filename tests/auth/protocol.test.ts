import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSignature, symmetricEncodeJWT } from "better-auth/crypto";
import { createHash } from "node:crypto";
import { parseAuthConfig } from "@/lib/auth/config";
import { handleAccountRequest, handleAuthRequest } from "@/lib/auth/http";
import * as authServer from "@/lib/auth/server";

// Real SDK/crypto; every provider request is intercepted. These are not Google consent tests.
const origin = "https://vamm.example.test";
const config = parseAuthConfig({ BETTER_AUTH_URL: origin,
  BETTER_AUTH_SECRET: "test_only_secret_0123456789_abcdefghijklmnopqrstuvwxyz",
  GOOGLE_CLIENT_ID: "123-test.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "test-only-google-client-secret",
  NODE_ENV: "production" })!;
const socialBody = { provider: "google", callbackURL: "/profile", errorCallbackURL: "/profile?authError=oauth" };
let auth: ReturnType<typeof authServer.createGoogleAuth>;
let network: ReturnType<typeof vi.fn>;
function post(path: string, body: unknown, cookie?: string) {
  return new Request(origin + path, { method: "POST", headers: { origin, "Content-Type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
}
function cookies(response: Response) { return response.headers.getSetCookie().map(line => line.split(";", 1)[0]).join("; "); }
async function begin() {
  const response = await handleAuthRequest(post("/api/auth/sign-in/social", socialBody));
  expect(response.status).toBe(200);
  const data = await response.json() as { url: string; redirect: boolean };
  return { response, url: new URL(data.url), cookie: cookies(response) };
}
function callback(query: URLSearchParams, cookie = "") {
  return new Request(origin + "/api/auth/callback/google?" + query, { headers: { cookie, "Sec-Fetch-Site": "cross-site" } });
}
function expectSafeFailure(response: Response) {
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(origin + "/profile?authError=oauth");
  expect(response.headers.get("cache-control")).toBe("no-store");
}
beforeEach(() => {
  auth = authServer.createGoogleAuth(config);
  vi.spyOn(authServer, "getAuthRuntime").mockReturnValue({ config, auth });
  network = vi.fn(() => { throw new Error("Unexpected provider request in an isolated test."); });
  vi.stubGlobal("fetch", network);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("actual SDK authorization state and PKCE", () => {
  it("creates encrypted HttpOnly state, minimal scopes and an S256 challenge without provider access", async () => {
    const { response, url, cookie } = await begin();
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("redirect_uri")).toBe(origin + "/api/auth/callback/google");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")?.split(" ").sort()).toEqual(["email", "openid", "profile"]);
    expect(url.searchParams.get("access_type")).toBe("online");
    expect(url.searchParams.get("include_granted_scopes")).not.toBe("true");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{32}$/);
    const header = response.headers.getSetCookie().find(line => line.includes("oauth_state="));
    expect(header).toBeDefined();
    expect(header).toMatch(/HttpOnly/i); expect(header).toMatch(/Secure/i); expect(header).toMatch(/SameSite=Lax/i);
    expect(cookie).not.toContain("codeVerifier"); expect(cookie).not.toContain("callbackURL");
    expect(cookie).not.toContain("account_data"); expect(network).not.toHaveBeenCalled();
  });
  it.each(["missing state", "missing cookie", "mismatched state", "tampered cookie", "expired state"])("rejects %s before a token request", async mode => {
    if (mode === "expired state") { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-07T00:00:00Z")); }
    const flow = await begin();
    const query = new URLSearchParams({ code: "unusable-test-code", state: flow.url.searchParams.get("state")! });
    let cookie = flow.cookie;
    if (mode === "missing state") query.delete("state");
    if (mode === "missing cookie") cookie = "";
    if (mode === "mismatched state") query.set("state", "unrelated-state");
    if (mode === "tampered cookie") cookie = cookie.replace(/=(.)/, (_, first: string) => "=" + (first === "A" ? "B" : "A"));
    if (mode === "expired state") vi.setSystemTime(new Date("2026-11-07T00:10:01Z"));
    expectSafeFailure(await handleAuthRequest(callback(query, cookie)));
    expect(network).not.toHaveBeenCalled();
  });
  it("consumes state for provider cancellation and clears the state cookie", async () => {
    const flow = await begin();
    const response = await handleAuthRequest(callback(new URLSearchParams({ state: flow.url.searchParams.get("state")!, error: "access_denied", error_description: "provider detail must not leak" }), flow.cookie));
    expectSafeFailure(response);
    expect(response.headers.getSetCookie().some(line => line.includes("oauth_state=") && /Max-Age=0/i.test(line))).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });
  it("uses the matching PKCE verifier in the SDK token exchange; intercepted rejection remains generic", async () => {
    const flow = await begin();
    network.mockImplementation(async () => Response.json({ error: "invalid_grant", error_description: "test-only provider rejection" }, { status: 400 }));
    expectSafeFailure(await handleAuthRequest(callback(new URLSearchParams({ state: flow.url.searchParams.get("state")!, code: "test-only-code" }), flow.cookie)));
    expect(network).toHaveBeenCalledTimes(1);
    const [input, init] = network.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    const request = new Request(input, init);
    expect(request.url).toBe("https://oauth2.googleapis.com/token");
    const form = new URLSearchParams(await request.text());
    expect(form.get("grant_type")).toBe("authorization_code");
    expect(form.get("code")).toBe("test-only-code");
    const verifier = form.get("code_verifier"); expect(verifier).toBeTruthy();
    expect(createHash("sha256").update(verifier!).digest("base64url")).toBe(flow.url.searchParams.get("code_challenge"));
  });
});

async function sessionCookie(options: { expiredSession?: boolean; expiredJwe?: boolean; mismatchToken?: boolean; tampered?: boolean; wrongVersion?: boolean } = {}) {
  const context = await auth.$context;
  const token = "isolated-test-session-token";
  const now = new Date();
  const payload = {
    session: { id: "test-session", token, userId: "test-user", expiresAt: new Date(Date.now() + (options.expiredSession ? -60000 : 60000)), createdAt: now, updatedAt: now, ipAddress: null, userAgent: null },
    user: { id: "test-user", name: "Test student", email: "student@example.test", emailVerified: true, image: null, createdAt: now, updatedAt: now },
    updatedAt: Date.now(), version: options.wrongVersion ? "unrecognized-version" : "vamm-google-v1",
  };
  let jwe = await symmetricEncodeJWT(payload, context.secretConfig, "better-auth-session", options.expiredJwe ? -60 : 60);
  if (options.tampered) { const parts = jwe.split("."); parts[3] = (parts[3][0] === "A" ? "B" : "A") + parts[3].slice(1); jwe = parts.join("."); }
  const signedToken = options.mismatchToken ? "different-token" : token;
  const signed = signedToken + "." + await makeSignature(signedToken, context.secret);
  return context.authCookies.sessionToken.name + "=" + encodeURIComponent(signed) + "; " + context.authCookies.sessionData.name + "=" + encodeURIComponent(jwe);
}
describe("actual SDK encrypted stateless session verification", () => {
  it("accepts a locally generated SDK JWE and projects only display identity", async () => {
    const response = await handleAccountRequest(new Request(origin + "/api/account", { headers: { cookie: await sessionCookie() } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ configured: true, user: { name: "Test student", email: "student@example.test" } });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(network).not.toHaveBeenCalled();
  });
  it.each(["tampered", "expiredSession", "expiredJwe", "mismatchToken", "wrongVersion"] as const)("returns guest identity for %s", async failure => {
    const response = await handleAccountRequest(new Request(origin + "/api/account", { headers: { cookie: await sessionCookie({ [failure]: true }) } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ configured: true, user: null });
    expect(network).not.toHaveBeenCalled();
  });
  it("signs out by expiring only auth cookies without a provider request", async () => {
    const response = await handleAuthRequest(post("/api/auth/sign-out", {}, await sessionCookie()));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ success: true });
    expect(response.headers.getSetCookie().some(line => line.includes("vamm-auth.session_token=") && /Max-Age=0/i.test(line))).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });
});
