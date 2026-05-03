// src/lib/anthropic.ts
// Anthropic API client — uses fetch directly (no SDK needed for React Native)

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  answer: string;
  error?: string;
}

/**
 * Send a conversation to Claude and get a response.
 * @param messages  Full conversation history (role + content pairs)
 * @param system    Optional system prompt
 * @param maxTokens Max tokens to generate (default 1024)
 */
export async function callClaude(
  messages: Message[],
  system?: string,
  maxTokens = 1024
): Promise<AnthropicResponse> {
  if (!ANTHROPIC_API_KEY) {
    return {
      answer: '',
      error: 'Anthropic API key not set. Add EXPO_PUBLIC_ANTHROPIC_KEY to your .env file.',
    };
  }

  try {
    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: maxTokens,
      messages,
    };

    if (system) {
      body.system = system;
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return {
        answer: '',
        error: `API error ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const answer = data?.content?.[0]?.text ?? '';
    return { answer };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('callClaude failed:', message);
    return { answer: '', error: message };
  }
}

/**
 * RAG: Answer a user question grounded in their saved notes.
 * @param question      The user's question
 * @param noteChunks    Array of relevant note excerpts with their IDs
 * @param history       Previous conversation messages (for follow-up support)
 */
export async function askFromNotes(
  question: string,
  noteChunks: Array<{ id: string; text: string; category: string }>,
  history: Message[] = []
): Promise<AnthropicResponse> {
  const context = noteChunks
    .map(
      (n, i) =>
        `[Note ${i + 1} | ID: ${n.id} | Category: ${n.category}]\n${n.text.slice(0, 600)}`
    )
    .join('\n\n---\n\n');

  const system = `You are YaadAI, a personal knowledge assistant. You help users recall and understand notes they have saved as screenshots.

RULES:
1. Answer ONLY from the provided notes below. Do not use outside knowledge.
2. Always cite which note(s) you used by mentioning "Note 1", "Note 2", etc.
3. If the notes do not contain relevant information, say: "I couldn't find anything about that in your saved notes."
4. Be concise and helpful. Format nicely with bullet points when listing multiple items.
5. For follow-up questions, use the conversation history to stay in context.

SAVED NOTES:
${context || 'No relevant notes found.'}`;

  const messages: Message[] = [
    ...history,
    { role: 'user', content: question },
  ];

  return callClaude(messages, system, 1024);
}

/**
 * Quiz: Generate quiz questions from a block of note text.
 * Returns a JSON array of question objects.
 * @param noteText  The combined text of notes for the chosen topic
 * @param topic     The category/topic name
 * @param count     How many questions to generate (default 5)
 */
export async function generateQuiz(
  noteText: string,
  topic: string,
  count = 5
): Promise<AnthropicResponse> {
  const system = `You are a quiz generator. Given study notes, generate exactly ${count} quiz questions.

ALWAYS respond with ONLY a valid JSON array — no markdown, no preamble, no explanation.

Each item must follow this exact shape:
{
  "type": "mcq" | "truefalse" | "fillintheblank",
  "question": "string",
  "options": ["A", "B", "C", "D"],   // only for mcq; omit for others
  "answer": "string",                 // correct answer text (or "True"/"False")
  "explanation": "string"             // brief explanation of why this is correct
}

Mix the question types: include at least 2 mcq, 1 truefalse, 1 fillintheblank.
Questions must be derived strictly from the provided notes.`;

  const userMessage = `Topic: ${topic}\n\nNotes:\n${noteText.slice(0, 3000)}`;

  return callClaude([{ role: 'user', content: userMessage }], system, 2048);
}