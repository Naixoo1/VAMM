export interface AuthEnvironment {
  BETTER_AUTH_URL?: string; BETTER_AUTH_SECRET?: string; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; NODE_ENV?: string;
}
export interface GoogleAuthConfig { origin: string; secret: string; clientId: string; clientSecret: string; secure: boolean; }
export const AUTH_SUCCESS_PATH = "/profile";
export const AUTH_ERROR_PATH = "/profile?authError=oauth";

/** Presence/format readiness, not a claim that Google credentials were exercised. */
export function parseAuthConfig(environment: AuthEnvironment): GoogleAuthConfig | null {
  const { BETTER_AUTH_URL: baseURL, BETTER_AUTH_SECRET: secret, GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = environment;
  if (!baseURL || !secret || !clientId || !clientSecret) return null;
  if (baseURL !== baseURL.trim() || !/^[A-Za-z0-9+/_=-]{32,512}$/.test(secret) || new Set(secret).size < 8 ||
      secret === "better-auth-secret-12345678901234567890" ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{1,255}\.apps\.googleusercontent\.com$/.test(clientId) ||
      !/^[\x21-\x7e]{8,1024}$/.test(clientSecret)) return null;
  try {
    const url = new URL(baseURL);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
        (baseURL !== url.origin && baseURL !== url.origin + "/")) return null;
    const development = environment.NODE_ENV === "development" || environment.NODE_ENV === "test";
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(development && loopback && url.protocol === "http:")) return null;
    return { origin: url.origin, secret, clientId, clientSecret, secure: url.protocol === "https:" };
  } catch { return null; }
}
