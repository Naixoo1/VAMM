import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseAuthConfig } from "@/lib/auth/config";
import { handleAccountRequest, handleAuthRequest } from "@/lib/auth/http";

const mocks = vi.hoisted(() => ({ runtime: vi.fn(), handler: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ getAuthRuntime: mocks.runtime }));
const origin = "https://vamm.example.test";
const environment = { BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: "test_only_secret_0123456789_abcdefghijklmnopqrstuvwxyz", GOOGLE_CLIENT_ID: "123-test.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "test-only-google-client-secret", NODE_ENV: "production" };
const config = parseAuthConfig(environment)!;
const payload = { provider: "google", callbackURL: "/profile", errorCallbackURL: "/profile?authError=oauth" };
const authorization = "https://accounts.google.com/o/oauth2/v2/auth?client_id=123-test.apps.googleusercontent.com&redirect_uri=" + encodeURIComponent(origin + "/api/auth/callback/google") + "&response_type=code&scope=openid%20email%20profile&state=test-state";
function post(path = "/api/auth/sign-in/social", body: unknown = payload, headers: Record<string, string> = {}) {
  return new Request(origin + path, { method: "POST", headers: { origin, "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin", ...headers }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.runtime.mockReturnValue({ config, auth: { handler: mocks.handler } });
  mocks.handler.mockImplementation(async () => Response.json({ url: authorization, redirect: true, token: "must-not-leave-library" }, { headers: { "Set-Cookie": "vamm-auth.oauth_state=opaque-test; Path=/; HttpOnly; Secure; SameSite=Lax" } }));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external request."); }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("server-owned Google auth readiness", () => {
  it("accepts only an explicit canonical origin and complete private configuration", () => {
    expect(config).toMatchObject({ origin, secure: true });
    expect(parseAuthConfig({ ...environment, BETTER_AUTH_URL: origin + "/" })?.origin).toBe(origin);
    expect(parseAuthConfig({ ...environment, NODE_ENV: "development", BETTER_AUTH_URL: "http://localhost:3000" })?.secure).toBe(false);
  });
  it.each(["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const)("leaves guest mode available when %s is absent", key => {
    expect(parseAuthConfig({ ...environment, [key]: undefined })).toBeNull();
  });
  it.each(["https://user:pass@vamm.example.test", origin + "/api/auth", origin + "?x=1", origin + "#", "http://vamm.example.test", "http://localhost:3000", "javascript:alert(1)"])("rejects invalid production origin configuration: %s", value => {
    expect(parseAuthConfig({ ...environment, BETTER_AUTH_URL: value })).toBeNull();
  });
  it("rejects weak or malformed credentials without using default development secrets", () => {
    expect(parseAuthConfig({ ...environment, BETTER_AUTH_SECRET: "a".repeat(40) })).toBeNull();
    expect(parseAuthConfig({ ...environment, BETTER_AUTH_SECRET: "better-auth-secret-12345678901234567890" })).toBeNull();
    expect(parseAuthConfig({ ...environment, GOOGLE_CLIENT_ID: "not-a-google-web-client" })).toBeNull();
    expect(parseAuthConfig({ ...environment, GOOGLE_CLIENT_SECRET: "secret\nheader" })).toBeNull();
  });
});

describe("restricted public auth routes", () => {
  it("returns a working guest DTO and honest unavailable sign-in when unconfigured", async () => {
    mocks.runtime.mockReturnValue(null);
    const status = await handleAccountRequest(new Request(origin + "/api/account"));
    expect(status.status).toBe(200); expect(await status.json()).toEqual({ configured: false, user: null });
    expect(status.headers.get("Cache-Control")).toBe("no-store");
    expect((await handleAuthRequest(post())).status).toBe(503);
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it.each(["https://attacker.invalid", "null", "https://vamm.example.test.attacker.invalid", ""])("rejects a forged or absent request Origin: %s", async value => {
    const request = post(undefined, payload, { origin: value });
    expect((await handleAuthRequest(request)).status).toBe(403);
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it("rejects wrong canonical hosts or cross-site fetch metadata", async () => {
    expect((await handleAuthRequest(post(undefined, payload, { host: "attacker.invalid" }))).status).toBe(403);
    expect((await handleAuthRequest(post(undefined, payload, { "Sec-Fetch-Site": "cross-site" }))).status).toBe(403);
    const request = new Request("https://attacker.invalid/api/auth/sign-in/social", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    expect((await handleAuthRequest(request)).status).toBe(403);
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it.each([
    { ...payload, provider: "github" }, { ...payload, callbackURL: "https://attacker.invalid" },
    { ...payload, callbackURL: "//attacker.invalid" }, { ...payload, errorCallbackURL: "/profile?authError=leak" },
    { ...payload, idToken: { token: "untrusted" } }, { ...payload, scopes: ["https://www.googleapis.com/auth/drive"] },
    { ...payload, additionalParams: { redirect_uri: "https://attacker.invalid" } }, { ...payload, newUserCallbackURL: "/" },
  ])("rejects unknown fields, alternate flows or user-defined redirects", async body => {
    expect((await handleAuthRequest(post(undefined, body))).status).toBe(400);
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it.each(["/api/auth/get-session", "/api/auth/get-access-token", "/api/auth/refresh-token", "/api/auth/list-accounts", "/api/auth/link-social", "/api/auth/sign-in/email", "/api/auth/callback/github"])("denies unused auth endpoints: %s", async path => {
    expect((await handleAuthRequest(new Request(origin + path))).status).toBe(404);
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it("enforces exact JSON media types and actual body bytes", async () => {
    expect((await handleAuthRequest(post(undefined, payload, { "Content-Type": "application/jsonp" }))).status).toBe(400);
    const oversized = new Request(origin + "/api/auth/sign-in/social", { method: "POST", headers: { origin, "Content-Type": "application/json", "Content-Length": "1" }, body: JSON.stringify(payload) + " ".repeat(4096) });
    expect((await handleAuthRequest(oversized)).status).toBe(400);
    expect((await handleAuthRequest(post("/api/auth/sign-in/social?callbackURL=https://attacker.invalid"))).status).toBe(400);
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it("projects sign-in output and preserves encrypted-state cookie headers without exposing extra library fields", async () => {
    const response = await handleAuthRequest(post());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: authorization, redirect: true });
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects an unexpected authorization destination and redacts provider error bodies", async () => {
    mocks.handler.mockResolvedValueOnce(Response.json({ url: "https://attacker.invalid/?token=private" }));
    const first = await handleAuthRequest(post());
    expect(first.status).toBe(502); expect(await first.text()).not.toContain("private");
    mocks.handler.mockResolvedValueOnce(Response.json({ token: "private", message: "secret details" }, { status: 500 }));
    const second = await handleAuthRequest(post());
    expect(second.status).toBe(502); expect(await second.text()).not.toMatch(/private|secret details/);
  });
  it("accepts only an empty sign-out body and returns no library user/session data", async () => {
    expect((await handleAuthRequest(post("/api/auth/sign-out", { callbackURL: "/profile" }))).status).toBe(400);
    const response = await handleAuthRequest(post("/api/auth/sign-out", {}));
    expect(await response.json()).toEqual({ success: true });
  });
  it("lets the library verify cross-site Google callbacks and sanitizes failure redirects", async () => {
    mocks.handler.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: origin + "/profile?authError=oauth&error_description=private" } }));
    const response = await handleAuthRequest(new Request(origin + "/api/auth/callback/google?state=opaque&error=access_denied", { headers: { "Sec-Fetch-Site": "cross-site" } }));
    expect(response.status).toBe(302); expect(response.headers.get("Location")).toBe(origin + "/profile?authError=oauth");
    expect(await response.text()).toBe(""); expect(mocks.handler).toHaveBeenCalledOnce();
  });
  it("returns successful callbacks only to the fixed account page", async () => {
    mocks.handler.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: origin + "/profile" } }));
    expect((await handleAuthRequest(new Request(origin + "/api/auth/callback/google?code=test&state=test"))).headers.get("Location")).toBe(origin + "/profile");
    mocks.handler.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: "https://attacker.invalid" } }));
    expect((await handleAuthRequest(new Request(origin + "/api/auth/callback/google?code=test&state=test"))).headers.get("Location")).toBe(origin + "/profile?authError=oauth");
  });
});

describe("safe account projection", () => {
  it("returns only the verified display identity and no session/provider tokens", async () => {
    mocks.handler.mockResolvedValueOnce(Response.json({ user: { name: "Student", email: "student@example.test", emailVerified: true, id: "private-id", accessToken: "private-provider-token" }, session: { token: "private-session" } }));
    const response = await handleAccountRequest(new Request(origin + "/api/account"));
    expect(await response.json()).toEqual({ configured: true, user: { name: "Student", email: "student@example.test" } });
    expect(mocks.handler.mock.calls[0][0].url).toBe(origin + "/api/auth/get-session");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("returns guest identity for invalid sessions and never exposes an unverified email", async () => {
    mocks.handler.mockResolvedValueOnce(Response.json(null));
    expect(await (await handleAccountRequest(new Request(origin + "/api/account"))).json()).toEqual({ configured: true, user: null });
    mocks.handler.mockResolvedValueOnce(Response.json({ user: { name: "Student", email: "unverified@example.test", emailVerified: false } }));
    expect(await (await handleAccountRequest(new Request(origin + "/api/account"))).json()).toEqual({ configured: true, user: { name: "Student", email: null } });
  });
  it("rejects foreign origins before reading cookies", async () => {
    const response = await handleAccountRequest(new Request(origin + "/api/account", { headers: { origin: "https://attacker.invalid" } }));
    expect(response.status).toBe(403); expect(mocks.handler).not.toHaveBeenCalled();
  });
});
