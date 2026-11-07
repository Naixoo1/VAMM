# AI Investment Mentor

Open **AI Investment Mentor** at `/research`. It is a conversational workspace: ask a question, attach a chart screenshot, continue the discussion, or open an earlier chat from history. Company charts remain available under Market and Compare.

Conversations save automatically on this device, including submitted screenshots. New chat preserves previous sessions. Reloading or opening history does not request another model reply. Google sign-in does not sync or isolate this history. Anyone using this browser profile can access it; browser storage clearing or quota restrictions affect availability. Existing saved basket answers remain available as a separate read-only archive. Chats that were never stored by older versions cannot be reconstructed.

## Screenshots and answers

Upload PNG, JPEG or WebP, up to2MiB. Remove personal/account details before uploading. Sending a message transmits its recent conversation context and newest screenshot to the configured OpenAI model for analysis. The visible full history remains local; the model receives only the latest20 messages and newest screenshot, so mention important older details again.

The model can explain chart observations and conditional scenarios. A screenshot is a snapshot, not a live quote feed. Answers must distinguish visible evidence from uncertainty; no guaranteed forecasts, automatic trades or changes to Simulation. If the model is unavailable, the app retains the question and offers an explicit retry rather than inventing a live answer. Provider requests are not automatically retried. Replies are rendered as text, not executable HTML.

## Existing OpenAI configuration

In Vercel → **vamm** → Settings → Environment Variables → **Production**, set the existing `OPENAI_API_KEY` as a sensitive server variable and `OPENAI_MENTOR_MODEL` to a model that supports image inputs through the Responses API. Production currently selects `gpt-5.4-mini` on the existing authorized OpenAI service. If the Mentor-specific variable is absent, the endpoint can reuse `OPENAI_RESEARCH_MODEL`. Never use a `NEXT_PUBLIC_` prefix or commit secrets. These variables do not enable or change financial Simulation. Model capabilities were checked against [OpenAI's model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

Redeploy after setting environment variables. `GET /api/mentor-chat` exposes only `{configured: boolean}`. This reports configuration presence, not provider health or model vision compatibility. A completed real request is required to verify access. `VAMM_DISABLE_MODEL=1` disables model requests for local regression checks.

## Quick demonstration

1. Ask a short finance-learning question and wait for a model reply.
2. Upload a readable chart screenshot and ask what is visible, what remains unknown, and which conditional scenarios could be considered.
3. Ask a follow-up; show that the conversation context is retained.
4. Choose New chat, submit another question, reload, then reopen the first conversation.
5. Show the preserved Simulation independently. Chat has no authority to alter its data or calculations.

Verification and deployment evidence: `orchestration/reviews/MENTOR-CHAT-2026-11-07.md`.
