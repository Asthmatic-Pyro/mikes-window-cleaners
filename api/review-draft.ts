import { env } from "./_lib/env.js";

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

type Answers = {
  cleaned?: string;
  after?: string;
  again?: string;
  comments?: string;
};

export async function POST(request: Request) {
  const key = env("GROQ_API_KEY");
  if (!key) {
    return Response.json(
      { error: "Llama drafting is offline until GROQ_API_KEY is set. Nothing was published." },
      { status: 503 },
    );
  }

  let answers: Answers;
  try {
    answers = (await request.json()) as Answers;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const cleaned = answers.cleaned?.trim() ?? "";
  const after = answers.after?.trim() ?? "";
  const again = answers.again?.trim() ?? "";
  const comments = answers.comments?.trim() ?? "";
  if (!comments) {
    return Response.json({ error: "Open comments are required." }, { status: 400 });
  }

  const userPrompt = [
    `What was cleaned: ${cleaned || "(not answered)"}`,
    `How it looked after: ${after || "(not answered)"}`,
    `Would they book again: ${again || "(not answered)"}`,
    `Open comments (most important): ${comments}`,
  ].join("\n");

  let lastError = "Llama did not return a draft.";
  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          max_tokens: 220,
          messages: [
            {
              role: "system",
              content:
                "You write a BRIEF first-person customer review (2–4 sentences) for Mike's Window Cleaners. Use ONLY the customer's answers. Never invent a city, price, date, job type, or claim. Keep a constructive, specific attitude — not hype, not insults. Do not mention that you are an AI.",
            },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      };
      if (!res.ok) {
        lastError = json.error?.message || `Groq ${res.status}`;
        continue;
      }
      const draft = json.choices?.[0]?.message?.content?.trim();
      if (draft) return Response.json({ draft, model });
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }

  return Response.json({ error: lastError }, { status: 502 });
}
