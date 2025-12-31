const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generatePostFromText(text, options = {}) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  if (!text || typeof text !== "string") throw new Error("Invalid text input");

  const { tone = "professional", withHashtags = true, withEmojis = false } = options;

  const prompt = `
You are a professional LinkedIn content writer.
Rewrite the following idea into a high-quality LinkedIn post.
Tone: ${tone}
${withHashtags ? "Add relevant hashtags at the end." : ""}
${withEmojis ? "Use suitable emojis." : ""}

User idea:
"${text}"
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI error:", data);
    throw new Error(data.error?.message || "OpenAI request failed");
  }

  // التحقق من وجود النص بطريقة آمنة
  // Try to extract text for both the new Responses API and older Chat Completion shapes
  let outputText = null;

  if (Array.isArray(data.output) && data.output.length > 0) {
    const first = data.output[0];
    if (Array.isArray(first.content)) {
      outputText = first.content.find(c => c.type === "output_text")?.text || null;
    } else if (typeof first.content === "string") {
      outputText = first.content;
    }
  }

  outputText = outputText || data.output_text || data.choices?.[0]?.message?.content || data.choices?.[0]?.text || null;

  if (!outputText) {
    console.error("Unexpected OpenAI response:", JSON.stringify(data, null, 2));
    throw new Error("AI response did not contain text output");
  }

  return String(outputText).trim();
}

module.exports = { generatePostFromText };
