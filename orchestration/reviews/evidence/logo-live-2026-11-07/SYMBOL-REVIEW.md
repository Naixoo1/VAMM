# Read-only review of live-symbol form/helper — BRAND-LIVE-UI-01

Reviewer: Interface generic saved-role fallback. Requested by CEO after branding handoff. No Data/platform source was edited by this reviewer.

Files actually read from vamm-brand-live-staging/data:

- src/lib/data/live-symbols.ts
- src/lib/data/tradingview-widgets.ts
- src/components/features/live-market-comparison.tsx
- src/components/features/live-research.tsx
- src/components/features/live-market-widget.tsx
- src/components/features/live-market-widget.module.css

## Actionable finding — confirmed by CEO browser probe

P2 narrow-viewport overflow for a valid maximum-length listing. normalizeLiveSymbol accepts20exchange characters plus colon plus40ticker characters (live-symbols.ts:14). A normalized value is displayed in comparison/research context paragraphs (live-market-comparison.tsx:61 and live-research.tsx:45) and the provider description. The staged .context (CSS:55) and .description (CSS:20) lacked wrapping for long unbroken tokens.

Probe: ABCDEFGHIJKLMNOPQRST:ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN at320px. This reviewer identified the risk in source; CEO then rendered it and observed document scrollWidth579. That browser result is CEO-executed, not a worker runtime claim.

Recommended bounded repair: overflow-wrap:anywhere on the displayed context/description paragraphs while retaining normal input editing/scrolling. Add a rendered320px regression using the accepted long symbol. CEO is implementing the correction and regression. Data/platform was notified to avoid overwriting the CEO correction with the earlier staged stylesheet. No validation limit, supported format or provider failure safeguard needs weakening.

## Reviewed behavior without another actionable finding

- Both forms use native form submit and explicit Apply actions, preserving focused controls and current panels while a draft is typed. Provider props use committed selection only.
- Labels have matching htmlFor/input IDs; required text inputs retain datalist suggestions, autoCapitalize, spellcheck=false and maxLength61. Suggestions are explicitly examples rather than a restriction.
- Invalid submission uses fixed local role=alert text, aria-invalid and an existing error ID in aria-describedby; it focuses the actual invalid field. Duplicate normalized comparison listings focus the second field. This is immediate user-action feedback, not an asynchronous response that could steal later focus.
- Successful submission normalizes/capitalizes inputs, clears errors and updates committed provider props without keying/remounting the form. Existing MotionBoundary keys restart decoration only.
- Helper restricts exchange/ticker syntax, rejects markup/URLs/pipe-delimited expressions, encodes outbound symbol paths and explicitly disclaims listing/data-access verification. Cross-currency displays are percentage-based with no FX conversion/total-return claim. It makes no service request or financial calculation.
- The existing provider retry remains mounted after activation with aria-disabled and an early loading guard. Closed iframe/Web Component internals remain unverified provider-owned UI.
- CSS controls have min-width0/width100%,44px target heights, visible3px cobalt focus outlines, stacked fields below480px and fixed-color error states. Those source constraints alone do not prove rendered geometry; the confirmed long-token case above demonstrates the need for the additional probe.

## Limits

This review ran no browser/unit suite, model call, provider network request, server, package install or Git action. CEO reported18 normal route-width/logo renders passing decode/no page errors/no overflow, separately from the long-token failure. No other current form/helper source issue was identified; runtime native datalist/screen-reader/closed-provider behavior is not certified by this static review.
