import { handleAccountRequest } from "@/lib/auth/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = handleAccountRequest;
