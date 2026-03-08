export async function POST(req) {
  try {
    const { audience, problem, cause, workaround, cost } = await req.json();

    if (!audience || !problem || !cause || !workaround || !cost) {
      return Response.json({ error: "All five parts are required" }, { status: 400 });
    }

    const systemPrompt = `You are a startup hypothesis writer. Given raw founder inputs, write a single, tight, evidence-backed problem hypothesis statement.

Rules:
- Output ONLY the hypothesis sentence. No preamble, no explanation, no bullet points.
- Start with the specific audience.
- Use this structure: "[Audience] struggle with [problem] because [cause]. They currently [workaround], which costs them [cost]."
- Polish the language: remove filler words, tighten phrasing, preserve every concrete detail and number the founder gave.
- Do NOT invent facts. Only rephrase what you received.
- Output must be 2-4 sentences max. No markdown.`;

    const userMessage = `Audience: ${audience}
Problem: ${problem}
Root cause: ${cause}
Current workaround: ${workaround}
Cost: ${cost}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", err);
      return Response.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const hypothesis = data.content?.[0]?.text?.trim();

    if (!hypothesis) {
      return Response.json({ error: "No hypothesis generated" }, { status: 500 });
    }

    return Response.json({ hypothesis });
  } catch (e) {
    console.error("Hypothesis route error:", e);
    return Response.json({ error: "Failed to generate hypothesis" }, { status: 500 });
  }
}
