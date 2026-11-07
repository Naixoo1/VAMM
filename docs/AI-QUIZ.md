# AI-generated challenges

Open **Missions & Challenges**. In **AI-generated challenges**, choose Stocks, Risk or News and select **Generate 3 questions**. Generation uses the existing server-side OpenAI key and Mentor model configuration. No question-generation call happens until you choose Generate.

Choose one answer for each question and select **Submit AI answers**. The app calculates the score deterministically and reveals explanations. **Try these questions again** reuses the same questions without another model request. AI practice awards no XP and does not write attempt or financial history. Existing reviewed quiz packs below continue to support their original progress/XP workflow.

Questions are labeled AI-generated and can be wrong. They cover general educational concepts, not live prices, predictions or financial recommendations. The server validates exactly three questions, distinct choices/questions, answer indices and bounded text before displaying them. A failed generation preserves the previous practice and answers, and never retries automatically.

Configuration is shared with [Mentor](MENTOR-CHAT.md): `OPENAI_API_KEY` plus `OPENAI_MENTOR_MODEL` (currently `gpt-5.4-mini`; research-model fallback is supported). Both stay server-side. After replacing a key in Vercel Production, redeploy so functions use the new value.

If credentials are rejected, OpenAI returned401: replace the invalid/revoked/wrong-provider key with a valid OpenAI key, then redeploy. Model access and quota failures have separate messages; merely saving a variable does not prove model access. Never paste a secret into chat, public files or client environment variables.

The generation endpoint limits input size, output size, request frequency, concurrency and execution time. These are per-instance application guards, not a deployment-wide spending guarantee. No new provider, plugin or paid data service was added.
