import { createQuizGenerationHandlers } from "@/lib/ai/quiz-generation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;
const handlers = createQuizGenerationHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
