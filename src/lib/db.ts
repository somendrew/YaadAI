// src/lib/db.ts
// All Supabase database and storage operations

import { supabase } from './supabase';

export interface Screenshot {
  id: string;
  image_url: string | null;
  extracted_text: string;
  category: string;
  created_at: string;
  is_deleted: boolean;
}

// ── Upload image to Supabase Storage ──────────────────────────
export async function uploadImage(
  localUri: string,
  fileName: string
): Promise<string | null> {
  try {
    const fileExt = localUri.split('.').pop() ?? 'jpg';
    const filePath = `${Date.now()}_${fileName}.${fileExt}`;

    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('screenshots')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (e) {
    console.error('uploadImage failed:', e);
    return null;
  }
}

// ── Save screenshot record to DB ───────────────────────────────
export async function saveScreenshot(params: {
  image_url: string | null;
  extracted_text: string;
  category: string;
}): Promise<Screenshot | null> {
  const { data, error } = await supabase
    .from('screenshots')
    .insert([params])
    .select()
    .single();

  if (error) {
    console.error('saveScreenshot error:', error.message);
    return null;
  }
  return data as Screenshot;
}

// ── Fetch all non-deleted screenshots ─────────────────────────
export async function fetchScreenshots(category?: string): Promise<Screenshot[]> {
  let query = supabase
    .from('screenshots')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('fetchScreenshots error:', error.message);
    return [];
  }
  return (data ?? []) as Screenshot[];
}

// ── Search screenshots by text ─────────────────────────────────
export async function searchScreenshots(query: string): Promise<Screenshot[]> {
  const { data, error } = await supabase
    .from('screenshots')
    .select('*')
    .eq('is_deleted', false)
    .ilike('extracted_text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('searchScreenshots error:', error.message);
    return [];
  }
  return (data ?? []) as Screenshot[];
}

// ── Soft-delete a screenshot ───────────────────────────────────
export async function deleteScreenshot(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('screenshots')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    console.error('deleteScreenshot error:', error.message);
    return false;
  }
  return true;
}

// ── Get category counts for home stats ────────────────────────
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('screenshots')
    .select('category')
    .eq('is_deleted', false);

  if (error || !data) return {};

  return data.reduce((acc: Record<string, number>, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});
}
