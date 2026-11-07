export const MENTOR_CHAT_DATABASE_NAME = "vamm-mentor-chat-v1";
export const MENTOR_CHAT_STORE_NAME = "sessions";
export const MAX_CHAT_TEXT_LENGTH = 4000;
export const MAX_CHAT_REQUEST_MESSAGES = 20;
export const MAX_CHAT_IMAGE_BYTES = 2 * 1024 * 1024;

export type ChatImageMimeType = "image/png" | "image/jpeg" | "image/webp";
export interface ChatImage { name: string; mimeType: ChatImageMimeType; dataUrl: string; }
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  image?: ChatImage;
  origin?: "model";
}
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** Unsaved drafts start at 0; the first durable save returns 1. */
  revision: number;
  messages: ChatMessage[];
}
export type ChatErrorCode = "INVALID_INPUT" | "CONFLICT" | "STORAGE_UNAVAILABLE" | "CORRUPT_DATA";
export type ChatResult<T> = { ok: true; data: T } | { ok: false; error: { code: ChatErrorCode; message: string } };

/** Only the bounded transcript and newest selected screenshot cross the server boundary. */
export interface MentorChatRequest {
  messages: Array<Pick<ChatMessage, "role" | "content">>;
  image?: ChatImage;
}
