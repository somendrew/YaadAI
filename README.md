# YaadAI — Phase 1

Turn your screenshots into searchable, categorized knowledge. 100% free stack.

> Built with Expo SDK 54 + React Native + Supabase. Tested on iPhone via Expo Go.

---

## What's built

| Screen | What it does |
|--------|-------------|
| Home | Stats dashboard — total notes, topics, quick actions |
| Upload | Pick up to 20 screenshots, OCR extracts text, AI categorizes |
| Library | Browse all notes filtered by category |
| Search | Full-text search across all extracted text |
| Detail | View full text + original image, share or delete |

---

## Tech stack (all free)

| What | Tool | Cost |
|------|------|------|
| Framework | Expo SDK 54 + React Native | Free |
| OCR | @react-native-ml-kit/text-recognition | Free forever |
| Categorization | Rule-based keyword engine (on-device) | Free forever |
| Database | Supabase (free tier) | Free up to 500MB |
| Image storage | Supabase Storage (free tier) | Free up to 1GB |
| Navigation | Expo Router | Free |

---

## Setup — Step by step

### Step 1: Install tools

```bash
# Install Node.js from https://nodejs.org (LTS version)
# Install EAS CLI
npm install -g eas-cli
```

### Step 2: Clone and install

```bash
cd YaadAI
npm install --legacy-peer-deps
```

### Step 3: Environment variables

Create a `.env` file in the project root:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Then update `src/lib/supabase.ts` to use these env variables.

> ⚠️ Never commit real keys to GitHub. The `.env` file is in `.gitignore`.

### Step 4: Set up Supabase (free)

1. Go to https://supabase.com → Create free project
2. Go to **SQL Editor** and run this:

```sql
create table screenshots (
  id uuid default gen_random_uuid() primary key,
  image_url text,
  extracted_text text,
  category text default 'General',
  created_at timestamp with time zone default now(),
  is_deleted boolean default false
);

alter table screenshots enable row level security;
create policy "Allow all" on screenshots for all using (true);

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true);

create policy "Allow uploads" on storage.objects
for insert with check (bucket_id = 'screenshots');

create policy "Allow reads" on storage.objects
for select using (bucket_id = 'screenshots');
```

3. Go to **Settings → API Keys → Legacy anon key**
4. Copy URL and anon key → paste in `.env`

### Step 5: Run on device

**Option A — Expo Go (quickest, no OCR)**
```bash
npx expo start --tunnel
# Scan QR with iPhone camera → tap Expo Go
```

**Option B — Full build with OCR (Android)**
```bash
eas login
eas build:configure   # select Android
eas build --platform android --profile development
# Download APK → install on Android phone
npx expo start --tunnel
```

> Note: iOS native build requires paid Apple Developer account (₹8000/year)

---

## File structure

```
YaadAI/
├── app/                    # Expo Router screens
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── upload.tsx
│   ├── library.tsx
│   ├── search.tsx
│   └── detail.tsx
├── assets/                 # App icons and splash
│   ├── icon.png
│   ├── adaptive-icon.png
│   └── splash.png
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── DetailScreen.tsx
│   ├── hooks/
│   │   └── useOCR.ts
│   └── lib/
│       ├── supabase.ts
│       ├── db.ts
│       └── categorizer.ts
├── .env                    # ← your keys (never commit this)
├── .gitignore
├── app.json
├── babel.config.js
└── package.json
```

---

## Auto-detected categories

DSA & Algorithms, System Design, Interview Questions, Job Description, React & Frontend, Backend & APIs, Database, DevOps & Cloud, Machine Learning, Mathematics, Language & Grammar, Finance & Business, Health & Fitness, Recipes & Food, General Notes

---

## Known limitations in Expo Go

- OCR (text extraction) requires native build — won't work in Expo Go
- Upload flow works but text will show as "[No text detected]"
- Full OCR works after Android APK build via EAS

---

## Phase 2 (coming next)

- AI Q&A — ask questions from your notes (RAG)
- Daily quiz generator topic-wise
- Spaced repetition algorithm
- Follow-up conversations per note