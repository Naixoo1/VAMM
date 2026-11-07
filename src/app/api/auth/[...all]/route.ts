import { handleAuthRequest } from "@/lib/auth/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;
export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
