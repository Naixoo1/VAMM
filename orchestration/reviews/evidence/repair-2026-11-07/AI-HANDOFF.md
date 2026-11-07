# AUDIT-01 grounding repair handoff

Project: C:/code/VAMM. Simulation/AI uses the generic-worker fallback with the saved role TOML and current guidance read. No delegation. All authored files are staged under vamm-fixes-staging/simulation; CEO imports through the approved project-write workflow. No direct project writes, model requests, secret inspection, dependency/configuration changes or Git actions were performed by this worker.

## Problem and alternatives

The prior implementation accepted well-shaped arbitrary summary/fact prose when its evidence ID existed. CEO reproduced three failures using deliberately fabricated provider responses: a live valuation, guaranteed personalized buy/sell advice, and an invented synthetic 99% return. These were not observed live model outputs.

Two materially different approaches were compared:

| Approach | Benefits | Limits / decision |
|---|---|---|
| Continue free-form answers and add a deterministic semantic/numeric validator | Retains flexible language and arbitrary question coverage. | A finite parser cannot establish factual support for unrestricted summaries, recommendations or paraphrases. Keyword blocking is bypassable and rejects harmless explanations. A second model verifier would add cost and another uncertain judgment. Rejected for this bounded repair. |
| Model selects bounded server-owned summary, claim and limitation IDs | Every displayed claim is resolved to canonical server-authored text and frozen fixture metrics; input relevance/order still uses one model response. No arbitrary prose or numbers cross the output boundary. | Wording and topic coverage are narrower; the model can choose a supported but less relevant explanation. The response explicitly discloses prewritten model-selected explanations and that some question details may remain unanswered. Selected. |

The model-backed path is retained: model selection changes the actual summary, facts, order and limitations, with origin=model. It does not always fall back or relabel unvalidated prose. Unconfigured/refused/invalid/timeout behavior remains labeled origin=prewritten.

## Changed files

- src/lib/ai/research-catalog.ts: creates scoped summaries/claims/limitations from selected frozen instruments; parses strict private selections; resolves all public text/evidence; builds the enum-only upstream schema.
- src/lib/ai/research.ts: supplies the catalog to the provider on an independent structured clone; resolves responses against its untouched server-owned catalog; preserves request/public response, deadline and fallback.
- src/lib/ai/server-provider.ts: requests private selection IDs instead of arbitrary prose; keeps server-only configuration, fixed Responses endpoint, no tools, store=false, byte cap, refusal/incomplete handling and one request.
- tests/ai/research.test.ts: updates genuine success to supported selection; retains malformed/refusal/timeout/no-retry tests.
- tests/ai/provider-route.test.ts: retains route guard tests, updates mocked upstream schema/context, and adds full mocked HTTP-to-public-model-response success.
- tests/ai/research-selection.test.ts: comparison/fee success, canonical values/order, selected-instrument scope, unknown summary/claim/limitation, duplicate IDs, extra prose, nested prose, protocol version, empty selection, injected question and provider-copy mutation isolation.
- tests/ai/audit-grounding.test.ts: original three adversarial regressions retained byte-for-byte.

## Precise interfaces

Public contract remains v2: ResearchRequest and ResearchResponse are unchanged. No client-supplied catalog is accepted. The existing ResearchProvider callback still returns Promise<unknown>; its private ResearchContext now also requires `catalog: ResearchCatalog`. Test/provider callers constructing context directly should use createResearchCatalog(selectedFrozenInstruments). Normal runResearch callers are unchanged.

Valid private response example for the selected bonds/equity request:

```json
{
  "protocolVersion": "research-selection.v1",
  "summaryId": "compare-selected",
  "claimIds": ["edu-equity:cumulative-return", "edu-bonds:cumulative-return"],
  "limitationIds": ["synthetic-only"]
}
```

Claim and summary availability is server-scoped: other instruments and a two-basket comparison summary are not permitted for a one-basket request. All keys are required; extra keys, duplicate IDs and empty/oversized claim lists are rejected. Provider-selected limitation IDs cannot insert arbitrary text. The provider's disposable context can be mutated without altering canonical text/evidence used by resolution; a valid selection still produces the original safe content.

The private version does not change any public contract or fixture version. Official documentation supports strict structured Responses output with enums; independent server validation still applies: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

## Checks and integration

Performed by this worker:

- Seven staged TypeScript files: zero transpile syntax diagnostics.
- Full read-only TypeScript compiler overlay against the project's actual config/source graph: zero errors; no emit/project files written.
- Existing researchFallback function body unchanged.
- Original three adversarial regression test bytes unchanged.
- No engine, gateway, fixture, contract, DB, identity or project configuration edits.

CEO imported all seven TypeScript files and reported 102/102 integrated AI/storage/API tests passed. The unchanged original 27 audit probes also passed, including all three formerly failing grounding assertions. These runtime results were executed by the CEO, not the worker. CEO also reports all 32 protected hashes preserved. Full build/browser release verification remains with the CEO. Real model access remains untested and was not requested; provider checks used mocks only.

## Preserved boundaries

One 15-second service deadline, no automatic retry, bounded request/output and server-only credentials remain. Research has no financial-state authority. Questions, provider responses and live-widget data cannot alter the server-owned catalog or initiate tools/transactions. No screenshot, live-model-data or trading feature was added. Aegis remains application runtime coordination, separate from the development role.

## Independent Interface safety review

Read-only reviewed Interface staged motion CSS, AppShell/workspace attributes, Simulation history render, and retry controls. Sitewide effects use short transforms without opacity/value tween or animation callbacks; static/OS reduced motion disable them and pause stops VAMM timelines. No financial controller remount or animation-triggered mutation was found in the reviewed diff. Reported one source-level follow-up to Interface/CEO: the inner PreservedSession ErrorNotice retry at simulation-history.tsx:11 still unmounts after success, resembling the focus-loss pattern; this separate history case was not runtime reproduced. No Interface file was edited.
