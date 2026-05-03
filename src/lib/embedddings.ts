// src/lib/embeddings.ts
// Text search helper — uses Supabase ilike (free, no vector DB needed)
// Scores and ranks results locally after fetching from DB.

import { supabase } from './supabase';

export interface NoteChunk {
  id: string;
  text: string;
  category: string;
  image_url: string;
  score: number;
}

/**
 * Search notes using Supabase ilike on extracted_text.
 * Splits the query into keywords and ranks results by keyword hit count.
 *
 * @param query       The user's search/question string
 * @param maxResults  Max number of relevant chunks to return (default 5)
 */
export async function searchNotes(
  query: string,
  maxResults = 5
): Promise<NoteChunk[]> {
  if (!query.trim()) return [];

  // Extract meaningful keywords (≥3 chars, skip stopwords)
  const stopwords = new Set([
    'the', 'and', 'for', 'are', 'was', 'did', 'what', 'how',
    'why', 'who', 'when', 'where', 'with', 'from', 'that',
    'this', 'have', 'has', 'can', 'about', 'tell', 'show',
    'give', 'find', 'any', 'all', 'some',
  ]);

  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopwords.has(w));

  if (keywords.length === 0) {
    // Fallback: use first 3 words of query as-is
    keywords.push(...query.split(/\s+/).slice(0, 3));
  }

  // Build OR filter: each keyword as a separate ilike clause
  const ilikeFilter = keywords
    .map((kw) => `extracted_text.ilike.%${kw}%`)
    .join(',');

  const { data, error } = await supabase
    .from('screenshots')
    .select('id, extracted_text, category, image_url')
    .eq('is_deleted', false)
    .not('extracted_text', 'is', null)
    .or(ilikeFilter)
    .limit(20); // Fetch up to 20, then rank locally

  if (error) {
    console.error('searchNotes error:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Score each result by how many keywords it contains
  const scored: NoteChunk[] = data.map((row) => {
    const lowerText = (row.extracted_text ?? '').toLowerCase();
    const hits = keywords.filter((kw) => lowerText.includes(kw)).length;
    return {
      id: row.id,
      text: row.extracted_text ?? '',
      category: row.category ?? 'General',
      image_url: row.image_url ?? '',
      score: hits,
    };
  });

  // Sort by score desc, return top N
  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Fetch all notes for a given category (for quiz generation).
 * Returns combined text and list of note IDs.
 */
export async function fetchNotesByCategory(category: string): Promise<{
  combinedText: string;
  ids: string[];
}> {
  const { data, error } = await supabase
    .from('screenshots')
    .select('id, extracted_text')
    .eq('category', category)
    .eq('is_deleted', false)
    .not('extracted_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) {
    console.error('fetchNotesByCategory error:', error?.message);
    return { combinedText: '', ids: [] };
  }

  const ids = data.map((r) => r.id);
  const combinedText = data
    .map((r) => r.extracted_text ?? '')
    .join('\n\n---\n\n');

  return { combinedText, ids };
}

/**
 * Fetch distinct categories that have at least one non-deleted note.
 */
export async function fetchCategoriesWithNotes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('screenshots')
    .select('category')
    .eq('is_deleted', false)
    .not('extracted_text', 'is', null);

  if (error || !data) return [];

  const unique = [...new Set(data.map((r) => r.category).filter(Boolean))];
  return unique.sort();
}