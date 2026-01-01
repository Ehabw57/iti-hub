
/**
 * Helper to call OpenAI API and extract text response
 */
async function callOpenAI(prompt, temperature = 0.7) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  console.log(process.env);
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI error:", data);
    throw new Error(data.error?.message || "OpenAI request failed");
  }

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

/**
 * Generate a post from user text/idea
 * Returns content without hashtags and hashtags as separate array (max 5)
 * @returns {Object} { content: string, hashtags: string[] }
 */
async function generatePostFromText(text, options = {}) {
  if (!text || typeof text !== "string") throw new Error("Invalid text input");

  const { tone = "based on the user input", withEmojis = false } = options;

  const prompt = `
You are a content writer.
Rewrite the following idea into a high-quality LinkedIn post.
If user idea language is Arabic, write the post in Arabic.
If user idea language is English, write the post in English.
Follow user input tone and style.
Tone: ${tone}
${withEmojis ? "Include relevant emojis." : "No emojis."}

IMPORTANT: Do NOT include hashtags in the post content itself.
Instead, suggest up to 5 relevant hashtags separately.

Return your response in this exact JSON format:
{
  "content": "The post content without any hashtags",
  "hashtags": ["tag1", "tag2", "tag3"]
}

User idea:
"${text}"
`;

  const response = await callOpenAI(prompt, 0.7);
  
  // Parse JSON response
  try {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Clean hashtags (remove # if present, limit to 5)
    const hashtags = (parsed.hashtags || [])
      .slice(0, 5)
      .map(tag => tag.replace(/^#/, '').trim().toLowerCase())
      .filter(tag => tag.length > 0);
    
    return {
      content: parsed.content || response,
      hashtags
    };
  } catch (parseError) {
    // Fallback: extract hashtags from text if JSON parsing fails
    const hashtagMatches = response.match(/#[\w\u0600-\u06FF]+/g) || [];
    const hashtags = hashtagMatches
      .slice(0, 5)
      .map(tag => tag.replace(/^#/, '').trim().toLowerCase());
    
    // Remove hashtags from content
    const content = response
      .replace(/#[\w\u0600-\u06FF]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return { content, hashtags };
  }
}

/**
 * Answer a user question based on posts content
 * Returns AI answer with inline post references
 * @param {string} question - The user's question
 * @param {Array} posts - Array of posts with _id, content, author info
 * @returns {Object} { answer: string, referencedPosts: Array }
 */
async function answerFromPosts(question, posts) {
  if (!question || typeof question !== "string") {
    throw new Error("Invalid question input");
  }

  if (!posts || posts.length === 0) {
    return {
      answer: "Sorry, there are no posts available to answer your question.",
      referencedPosts: []
    };
  }

  // Build context from posts with reference IDs
  const postsContext = posts.map((post, index) => {
    const authorName = post.author?.fullName || post.author?.username || "Anonymous";
    return `[POST_${index + 1}] by ${authorName}:\n${post.content}\n`;
  }).join("\n---\n");

  const prompt = `
You are a helpful assistant that answers questions based on community posts (like Ask Reddit).
Below are posts from the community. Answer the user's question using ONLY information from these posts.

IMPORTANT RULES:
1. When you use information from a post, include the reference inline like this: [POST_1], [POST_2], etc.
2. If no posts are relevant to the question, say "I couldn't find relevant information in the community posts."
3. Be concise and helpful.
4. Match the language of the question (Arabic/English).
5. Cite multiple posts if they contain relevant information.

POSTS:
${postsContext}

USER QUESTION: "${question}"

Answer (with inline post references):
`;

  const answer = await callOpenAI(prompt, 0.5);

  // Extract referenced post IDs from the answer
  const referenceMatches = answer.match(/\[POST_(\d+)\]/g) || [];
  const referencedIndices = [...new Set(referenceMatches.map(ref => {
    const match = ref.match(/\[POST_(\d+)\]/);
    return match ? parseInt(match[1]) - 1 : null;
  }).filter(idx => idx !== null && idx >= 0 && idx < posts.length))];

  // Get referenced posts metadata
  const referencedPosts = referencedIndices.map(idx => {
    const post = posts[idx];
    return {
      _id: post._id,
      referenceId: `POST_${idx + 1}`,
      author: {
        _id: post.author?._id,
        username: post.author?.username,
        fullName: post.author?.fullName,
        profilePicture: post.author?.profilePicture
      },
      contentPreview: post.content?.substring(0, 100) + (post.content?.length > 100 ? "..." : ""),
      createdAt: post.createdAt,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0
    };
  });

  return {
    answer,
    referencedPosts
  };
}

module.exports = { generatePostFromText, answerFromPosts };
