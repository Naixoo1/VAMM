import { betterAuth } from "better-auth";
import { AUTH_ERROR_PATH, parseAuthConfig, type GoogleAuthConfig } from "./config";

/** No database or plugins. Provider token cookies are unnecessary for identity-only use. */
export function createGoogleAuth(config: GoogleAuthConfig) {
  if (typeof window !== "undefined") throw new Error("Account authentication is server-only.");
  return betterAuth({
    appName: "VAMM", baseURL: config.origin, basePath: "/api/auth", secret: config.secret,
    // Explicit key selection prevents unrelated versioned-secret environment defaults.
    secrets: [{ version: 1, value: config.secret }],
    trustedOrigins: [config.origin],
    socialProviders: { google: {
      clientId: config.clientId, clientSecret: config.clientSecret,
      disableDefaultScope: true, scope: ["openid", "email", "profile"], accessType: "online",
      includeGrantedScopes: false, disableIdTokenSignIn: true,
    } },
    emailAndPassword: { enabled: false },
    account: { storeStateStrategy: "cookie", storeAccountCookie: false, accountLinking: { enabled: false } },
    session: { expiresIn: 24 * 60 * 60, cookieCache: {
      enabled: true, strategy: "jwe", maxAge: 24 * 60 * 60, refreshCache: false, version: "vamm-google-v1",
    } },
    advanced: { cookiePrefix: "vamm-auth", useSecureCookies: config.secure, trustedProxyHeaders: false,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: config.secure } },
    logger: { disabled: true }, telemetry: { enabled: false },
    onAPIError: { errorURL: config.origin + AUTH_ERROR_PATH, onError: () => { /* Never log provider responses, cookies or credentials. */ } },
  });
}
export interface AuthRuntime { config: GoogleAuthConfig; auth: { handler(request: Request): Promise<Response> }; }
let cached: AuthRuntime | null = null;
export function getAuthRuntime(): AuthRuntime | null {
  if (typeof window !== "undefined") throw new Error("Account authentication is server-only.");
  const config = parseAuthConfig({
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL, BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });
  if (!config) { cached = null; return null; }
  if (!cached || Object.keys(config).some(key => config[key as keyof GoogleAuthConfig] !== cached!.config[key as keyof GoogleAuthConfig]))
    cached = { config, auth: createGoogleAuth(config) };
  return cached;
}
