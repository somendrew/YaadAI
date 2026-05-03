// src/hooks/useChat.ts
// RAG Q&A hook: searches user notes, sends context to Claude, maintains history.

import { useState, useCallback, useRef } from 'react';
import { searchNotes, NoteChunk } from '../lib/embeddings';
import { askFromNotes, Message } from '../lib/anthropic';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: NoteChunk[];   // which notes were cited
  loading?: boolean;
  error?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef<Message[]>([]); // Claude conversation history

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    // Optimistic: add user message + loading placeholder
    const loadingId = (Date.now() + 1).toString();
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      // 1. Search relevant notes
      const chunks = await searchNotes(question, 5);

      // 2. Call Claude with notes + full history for follow-up support
      const { answer, error } = await askFromNotes(
        question,
        chunks,
        historyRef.current
      );

      if (error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: `⚠️ ${error}`,
                  loading: false,
                  error: true,
                }
              : m
          )
        );
        return;
      }

      // 3. Update conversation history for follow-ups
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
      ];

      // Keep history bounded to last 10 turns (5 pairs) to stay within context
      if (historyRef.current.length > 10) {
        historyRef.current = historyRef.current.slice(-10);
      }

      // 4. Replace loading placeholder with real answer
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: answer,
                sources: chunks,
                loading: false,
              }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: '⚠️ Something went wrong. Please try again.',
                loading: false,
                error: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}