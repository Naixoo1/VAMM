import { createMentorChatHandlers } from "@/lib/ai/mentor-chat";
export const runtime = "nodejs";
export const maxDuration = 20;
export const dynamic = "force-dynamic";
const handlers = createMentorChatHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
