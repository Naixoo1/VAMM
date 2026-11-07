import { getNewsData } from "@/lib/data/fixtures";

export function GET(): Response {
  return Response.json({ ok: true, data: getNewsData() });
}

