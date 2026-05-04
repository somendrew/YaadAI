// src/lib/supabase.ts
// ─────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com and create a free project
// 2. Go to Project Settings → API
// 3. Copy your Project URL and anon/public key below
// 4. Run the SQL in the comment at the bottom to create the table
// ─────────────────────────────────────────────────────────────

// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// ─────────────────────────────────────────────────────────────
// Run this SQL once in your Supabase SQL editor:
// ─────────────────────────────────────────────────────────────
//
// create table screenshots (
//   id uuid default gen_random_uuid() primary key,
//   image_url text,
//   extracted_text text,
//   category text default 'General',
//   created_at timestamp with time zone default now(),
//   is_deleted boolean default false
// );
//
// -- Enable public read/write for now (tighten later with auth)
// alter table screenshots enable row level security;
// create policy "Allow all" on screenshots for all using (true);
//
// -- Create storage bucket for images
// insert into storage.buckets (id, name, public)
// values ('screenshots', 'screenshots', true);
//
// create policy "Allow uploads" on storage.objects
// for insert with check (bucket_id = 'screenshots');
//
// create policy "Allow reads" on storage.objects
// for select using (bucket_id = 'screenshots');
// ─────────────────────────────────────────────────────────────
