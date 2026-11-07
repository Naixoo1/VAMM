# Google sign-in setup

VAMM uses Google for optional account identity. Learning progress, saved research and Simulation history remain in the current browser. Signing in does not upload them, separate them by Google account, or make them private from another person using the same browser profile. Signing out leaves that device history intact.

The app uses Better Auth's Google provider with encrypted, HTTP-only stateless session cookies. There is no account database or paid authentication service. The frozen financial contract and browser owner are independent of this session.

## Google Cloud

Use your own Google Cloud account and project at [Google Auth Platform](https://console.cloud.google.com/auth/overview). No billing upgrade or paid data service is required for this integration.

1. Configure the application's branding/audience for **VAMM** with your support/contact email. For a testing audience, add the Google accounts that will record the demo as test users. Public availability depends on the audience/publishing settings in your Google project.
2. Create an OAuth client with application type **Web application**.
3. Register this exact production redirect URI: `https://vamm-nu.vercel.app/api/auth/callback/google`.
4. If testing locally, separately register `http://127.0.0.1:3000/api/auth/callback/google`. Use the exact hostname throughout; localhost and 127.0.0.1 are different origins.
5. Keep the resulting client secret private. Enter it directly in Vercel's environment settings, never in chat, a public template, Git or browser JavaScript.

Only identity scopes are used: `openid`, `email`, and `profile`. The app does not request access to Gmail, Drive, Calendar or offline Google API access.

## Vercel production variables

Open the VAMM project's Settings → Environment Variables in the `naixoo1s-projects` team. Configure these for **Production**:

| Variable | Value |
| --- | --- |
| `BETTER_AUTH_URL` | `https://vamm-nu.vercel.app` |
| `BETTER_AUTH_SECRET` | A cryptographically random private session-encryption secret, at least32 bytes |
| `GOOGLE_CLIENT_ID` | The web application client ID from your Google project |
| `GOOGLE_CLIENT_SECRET` | The client secret, stored as Sensitive |

Do not prefix secrets with `NEXT_PUBLIC_`. Do not reuse a value from the teammate repository's publicly exposed environment example. Preview deployments should remain unconfigured unless you intentionally register a separate matching Google callback and credentials for them.

Provisioning on2026-11-07: `BETTER_AUTH_URL` and a generated48-byte `BETTER_AUTH_SECRET` were configured directly in Vercel Production. The secret was not written to the repository or displayed. Preserve this existing secret; only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` still require the owner's Google client.

After changing variables, redeploy the current production commit so the new deployment receives them. Git pushes to the connected `Naixoo1/VAMM` production branch `main` create new deployments automatically; a local file save alone does not deploy. Confirm the deployment reaches READY at the expected Git SHA before recording a demo.

## Activation check

With all four variables configured, use **Continue with Google** on the canonical production hostname. Complete Google's consent screen, verify the returned account summary, reload, and sign out. Check that local progress/history remains unchanged. Denied consent and failed login must leave a usable guest site.

Missing credentials deliberately disable Google login without breaking the existing education site. Automated tests use explicit fixtures and do not prove a real Google exchange. Actual OAuth activation requires the owner's Google client and successful consent/callback on the deployed hostname.

Reference: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Better Auth Google configuration](https://better-auth.com/docs/authentication/google), [stateless session behavior](https://better-auth.com/docs/concepts/session-management).
