# Google account login and presentation cleanup

Authority: after accepting production deployment, the user requested Google OAuth login, a Git update with three workers, and Vercel redeployment for each Git update. The user subsequently requested removal of the visible motion toolbar and unused rail V. Incoming screenshots are visual reference, not independent authorization.

## Accepted scope

Add optional Google account sign-in/sign-out and a verified account summary. Preserve anonymous access to all existing education pages. Account authentication does not migrate, clear, re-key or synchronize browser-local financial, learning or saved-research records. The account view must explain that device history remains separate.

Use maintained Better Auth 1.7.18 with its Google provider and encrypted stateless session cookies. No database, authentication plugin, paid service, password feature or new financial API is added. The minimum dependency addition necessarily updates package.json and package-lock.json; this is the only exception to the prior 36-file comparison manifest for the newly authorized OAuth feature. The other 34 protected files, including agent/build configuration, contract v2, fixtures and financial engine/storage remain unchanged.

Remove the visible Pause animations/Static motion toolbar and the decorative V below Profile. Decorative motion stays enabled by default; device reduced-motion, offscreen and hidden-document behavior remain respected. No animation affects calculations, waits or mutations.

## Ownership and interface

| Owner | Paths and responsibilities |
| --- | --- |
| CEO | dependency manifest/lockfile, this review, TASKS/INTAKE/ISSUES, final integration, environment provisioning, Git and Vercel |
| Data/platform | src/lib/auth/**; src/app/api/auth/**; src/app/api/account/**; focused server/auth unit tests |
| Interface | src/components/auth/**; src/hooks/use-account.ts; app-shell presentation files; src/app/profile/page.tsx; focused account UI tests |
| Simulation/AI | independent auth/security/browser regression tests and protected/financial-state review; no implementation in auth, financial or shared shell sources |

GET /api/account returns only {configured:boolean,user:null|{name:string,email:string|null}} and no-store caching. No session token, Google credential or provider token enters this projection. UI mutations use POST /api/auth/sign-in/social and POST /api/auth/sign-out; callback is GET /api/auth/callback/google. Return paths are fixed to /profile. Missing configuration leaves a working guest site and an honest unavailable sign-in state.

Server variables: BETTER_AUTH_URL (canonical HTTPS origin), BETTER_AUTH_SECRET (random encryption secret), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Production callback: https://vamm-nu.vercel.app/api/auth/callback/google. No NEXT_PUBLIC secret or imported upstream .env.example.

## Required verification

Validate origin/CSRF/state/PKCE and library-verified Google identity, callback and error redirects, missing configuration, expired/tampered session, safe sign-out and denied/provider-failure behavior. Exercise pending/error/signed-in UI with explicit mocks; distinguish those checks from an actual Google exchange. Compare all existing protected financial and local learning records across account UI outcomes. Run types/lint/build, applicable unit and browser regressions, secret-boundary checks, then push and verify Vercel's production deployment matches the Git SHA.

## External setup status

Vercel is connected and the current production site is https://vamm-nu.vercel.app. No Google OAuth credentials are configured there. The user authorized device access, but this session does not expose the node_repl runtime required by the installed Windows Computer Use skill, an authenticated Google Cloud tool, or an existing browser debugging session. Therefore Google console provisioning is not yet possible through available tools. Complete code/tests/deployment autonomously; keep live OAuth activation honestly pending until secure credentials exist.

CEO provisioned Production `BETTER_AUTH_URL` and a newly generated48-byte `BETTER_AUTH_SECRET` through the existing Vercel connection. Secret contents were never displayed or stored in source. Google client ID/secret remain absent. Production dependency audit reports zero known vulnerabilities; the full audit retains eight moderate advisories in the existing ESLint/minimatch development chain. No existing package versions were changed by the auth dependency addition.

The user explicitly chose “Finish the code and send setup steps”. Actual Google activation is therefore deferred by the user, not claimed complete. Instructions are in docs/GOOGLE-SIGN-IN.md.

## Implementation and observed verification

All three saved-role workers returned disjoint handoffs. The CEO reviewed/imported their staged sources into C:/code/VAMM and ran canonical checks. Account identity uses a separate no-store DTO; raw session/account/token APIs are not exposed. Only fixed Google sign-in, callback and POST sign-out operations reach the SDK. The server checks the canonical origin, browser Origin/fetch metadata, exact bounded JSON and fixed return paths. OAuth state/PKCE and Google identity validation are delegated to the maintained SDK. Session cookies are encrypted, HttpOnly, Secure in production and SameSite=Lax for the top-level OAuth return. Provider-token cookies, passwords, account linking, telemetry and sensitive logging are disabled. The new auth route has a20-second serverless duration limit.

- Full unit suite: **379/379 across34 suites**, including22 focused account UI tests and58 auth wrapper/SDK tests.
- Browser regression: **88/88 desktop/mobile** on the integrated build. After the final focused account-control refinements, all **6/6 account browser cases** passed again on the rebuilt application.
- Account visual sweep: **9/9 states** across320/390/1440px, no horizontal overflow or text-contrast findings; screenshots reviewed.
- Production build, final typecheck and lint passed. Git deployment status is recorded by the CEO at handoff.
- **34/34 remaining protected hashes unchanged**; only the documented manifest/lockfile dependency exception differs from the prior36-file proof.
- Live credential-free API checks returned guest account200/no-store, private raw-session404, wrong-method sign-out405 and unconfigured sign-in503 with a fixed safe message.

The SDK tests use real library state/PKCE/JWE handling with fake test secrets and intercepted network responses. They reject missing/mismatched/tampered/expired state, verify the S256 verifier, clear canceled flow cookies, validate encrypted session expiry/token/version/tampering and expire auth cookies on logout. Browser Google/account responses are explicit fixtures; no real Google consent, token exchange or model call was performed. Device-record comparisons cover nonempty financial, learning and saved-research stores across account failures, logout and account changes.

Initial findings fixed before delivery: Array.findLast exceeded the protected TypeScript library target (replaced with a compatible copied reverse/find); bare fragment/query markers were normalized by URL parsing (strict raw canonical configuration now rejects them); account retry controls could be remounted and mismatched aria-disabled semantics (stable controls and aligned read/action failure handling). Historical tracked screenshots were preserved; current-run artifacts live in the workspace visualization directory.
