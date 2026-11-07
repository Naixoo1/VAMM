import type { ErrorCode, Result } from "@/contracts";
import { runResearch } from "@/lib/ai/research";
import { configuredResearchProvider } from "@/lib/ai/server-provider";

export const runtime = "nodejs";
export const maxDuration = 20;
const MAX_BODY_BYTES = 8192;
const WINDOW_MS = 60000;
const requests = new Map<string, { count: number; expires: number }>();
let globalWindow = { count: 0, expires: 0 };
let inFlight = 0;

function error(code: ErrorCode, message: string, status: number) {
  const body: Result<never> = { ok: false, error: { code, message, retryable: code === "RATE_LIMITED", requestId: null } };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) } });
}
function allowed(request: Request): boolean {
  const now = Date.now();
  for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key);
  if (globalWindow.expires <= now) globalWindow = { count: 0, expires: now + WINDOW_MS };
  // Global and concurrency caps also bound callers that vary proxy headers.
  if (globalWindow.count >= 24 || inFlight >= 2) return false;
  const address = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "local").split(",")[0].slice(0, 200);
  const entry = requests.get(address) ?? { count: 0, expires: now + WINDOW_MS };
  if (entry.count >= 6) return false;
  entry.count += 1; requests.set(address, entry); globalWindow.count += 1;
  return true;
}
async function readInput(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new Error("size");
  if (!request.body) throw new Error("body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("size"); }
      body += decoder.decode(next.value, { stream: true });
    }
    body += decoder.decode();
  } finally { reader.releaseLock(); }
  return JSON.parse(body);
}
export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return error("INVALID_INPUT", "Send an application/json research request.", 400);
  }
  if (!allowed(request)) return error("RATE_LIMITED", "Research request limit reached. Please wait before trying again.", 429);
  inFlight += 1;
  try {
    let input: unknown;
    try { input = await readInput(request); } catch { return error("INVALID_INPUT", "Research request must be valid JSON within 8 KiB.", 400); }
    const result = await runResearch(input, configuredResearchProvider());
    return Response.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("INTERNAL_ERROR", "Research could not be completed.", 500);
  } finally { inFlight -= 1; }
}

