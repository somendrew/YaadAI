// src/hooks/useQuiz.ts
// Quiz generation hook with score tracking + spaced repetition for wrong answers.

import { useState, useCallback } from 'react';
import { generateQuiz } from '../lib/anthropic';
import { fetchNotesByCategory, fetchCategoriesWithNotes } from '../lib/embeddings';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'truefalse' | 'fillintheblank';
  question: string;
  options?: string[];   // only for mcq
  answer: string;
  explanation: string;
  wrongCount: number;   // spaced repetition: how many times answered wrong
}

export type QuizState = 'idle' | 'loading' | 'active' | 'finished' | 'error';

export interface QuizResult {
  total: number;
  correct: number;
  score: number; // 0–100
  wrongQuestions: QuizQuestion[];
}

export function useQuiz() {
  const [categories, setCategories] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [state, setState] = useState<QuizState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Load available categories
  const loadCategories = useCallback(async () => {
    const cats = await fetchCategoriesWithNotes();
    setCategories(cats);
    return cats;
  }, []);

  // Generate quiz for a topic
  const startQuiz = useCallback(async (topic: string, questionCount = 5) => {
    setState('loading');
    setError(null);
    setResult(null);
    setUserAnswers([]);
    setCurrentIndex(0);
    setSelectedTopic(topic);

    try {
      const { combinedText } = await fetchNotesByCategory(topic);

      if (!combinedText.trim()) {
        setState('error');
        setError(`No notes found for "${topic}". Upload some notes first!`);
        return;
      }

      const { answer: raw, error: apiError } = await generateQuiz(
        combinedText,
        topic,
        questionCount
      );

      if (apiError) {
        setState('error');
        setError(apiError);
        return;
      }

      // Parse Claude's JSON response
      let parsed: Omit<QuizQuestion, 'id' | 'wrongCount'>[];
      try {
        // Strip any accidental markdown fences
        const clean = raw.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        setState('error');
        setError('Failed to parse quiz questions. Please try again.');
        return;
      }

      const quizQuestions: QuizQuestion[] = parsed.map((q, i) => ({
        ...q,
        id: `q_${Date.now()}_${i}`,
        wrongCount: 0,
      }));

      setQuestions(quizQuestions);
      setState('active');
    } catch (err: unknown) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Submit an answer for the current question
  const submitAnswer = useCallback(
    (answer: string) => {
      const current = questions[currentIndex];
      if (!current) return;

      const isCorrect =
        answer.trim().toLowerCase() === current.answer.trim().toLowerCase();

      // Update wrongCount for spaced repetition
      if (!isCorrect) {
        setQuestions((prev) =>
          prev.map((q, i) =>
            i === currentIndex ? { ...q, wrongCount: q.wrongCount + 1 } : q
          )
        );
      }

      setUserAnswers((prev) => [...prev, answer]);

      if (currentIndex + 1 >= questions.length) {
        // Quiz finished — compute results
        const allAnswers = [...userAnswers, answer];
        const correct = allAnswers.filter((ans, i) => {
          const q = questions[i];
          return ans.trim().toLowerCase() === q?.answer.trim().toLowerCase();
        }).length;

        const wrongQuestions = questions.filter((q, i) => {
          const ans = allAnswers[i] ?? '';
          return ans.trim().toLowerCase() !== q.answer.trim().toLowerCase();
        });

        setResult({
          total: questions.length,
          correct,
          score: Math.round((correct / questions.length) * 100),
          wrongQuestions,
        });
        setState('finished');
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, questions, userAnswers]
  );

  // Retry only wrong questions (spaced repetition)
  const retryWrongAnswers = useCallback(async () => {
    if (!result || result.wrongQuestions.length === 0) return;

    // Increment wrongCount for these, then restart with them
    const retryQuestions: QuizQuestion[] = result.wrongQuestions.map((q) => ({
      ...q,
      id: `retry_${Date.now()}_${q.id}`,
    }));

    setQuestions(retryQuestions);
    setCurrentIndex(0);
    setUserAnswers([]);
    setResult(null);
    setState('active');
  }, [result]);

  // Reset to idle
  const reset = useCallback(() => {
    setState('idle');
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setResult(null);
    setError(null);
    setSelectedTopic(null);
  }, []);

  const currentQuestion = questions[currentIndex] ?? null;
  const progress =
    questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  return {
    // State
    state,
    error,
    categories,
    questions,
    currentQuestion,
    currentIndex,
    userAnswers,
    result,
    selectedTopic,
    progress,
    // Actions
    loadCategories,
    startQuiz,
    submitAnswer,
    retryWrongAnswers,
    reset,
  };
}