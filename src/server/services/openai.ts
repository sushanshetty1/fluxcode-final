import OpenAI from "openai";
import { env } from "~/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateDailySuggestion(completedTopics: string[]): Promise<{
  topicName: string;
  subcategories: string[];
  difficulty: string;
  reasoning: string;
}> {
  const availableTopics = [
    "Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting",
    "Greedy", "Depth-First Search", "Binary Search", "Database", 
    "Breadth-First Search", "Tree", "Matrix", "Two Pointers", "Binary Tree",
    "Bit Manipulation", "Stack", "Heap (Priority Queue)", "Graph", "Prefix Sum",
    "Simulation", "Sliding Window", "Linked List", "Backtracking", "Divide and Conquer"
  ].filter(t => !completedTopics.includes(t));

  const prompt = `You are an AI assistant helping to suggest the next topic for a coding contest.
  
Previously completed topics: ${completedTopics.join(", ") || "None"}
Available topics: ${availableTopics.join(", ")}

Suggest the next topic from the available topics that would provide a good learning progression. Include:
- Topic name (must be from available topics list)
- 3-5 subcategories (LeetCode tags related to this topic)
- Appropriate difficulty level (Easy, Medium, or Hard)
- Brief reasoning

Return ONLY a valid JSON object with this structure:
{
  "topicName": "string",
  "subcategories": ["string"],
  "difficulty": "string",
  "reasoning": "string"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content) as {
    topicName: string;
    subcategories: string[];
    difficulty: string;
    reasoning: string;
  };
}

export async function generateMotivationalMessage(stats: {
  totalSolved: number;
  currentStreak: number;
  recentProgress: string;
}) {
  const prompt = `You are an AI motivational coach for a coding contest participant.

User's stats:
- Total problems solved: ${stats.totalSolved}
- Current streak: ${stats.currentStreak} days
- Recent progress: ${stats.recentProgress}

Generate a short, encouraging message (2-3 sentences) to motivate them to keep going.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 150,
  });

  return completion.choices[0]?.message?.content ?? "Keep up the great work!";
}

export async function generateLearningPath(topics: string[]) {
  const prompt = `You are an AI assistant creating a learning path for coding contest preparation.

Available topics: ${topics.join(", ")}

Create an optimal learning sequence that:
1. Starts with fundamentals
2. Progressively increases difficulty
3. Groups related topics together
4. Provides reasoning for the order

Return ONLY a valid JSON array of objects with this structure:
[
  {
    "topic": "string",
    "order": number,
    "reasoning": "string"
  }
]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content) as Array<{
    topic: string;
    order: number;
    reasoning: string;
  }>;
}
