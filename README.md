# YaadAI — Phase 1

Turn your screenshots into searchable, categorized knowledge. 100% free stack.

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
| OCR | react-native-mlkit-ocr (on-device) | Free forever |
| Categorization | Rule-based keyword engine | Free forever |
| Database | Supabase (free tier) | Free up to 500MB |
| Image storage | Supabase Storage (free tier) | Free up to 1GB |
| Navigation | Expo Router | Free |

---

## Setup — Step by step

### Step 1: Install tools

```bash
# Install Node.js from https://nodejs.org (LTS version)

# Install Expo CLI
npm install -g expo-cli

# Install EAS CLI (needed for building with native OCR)
npm install -g eas-cli
```

### Step 2: Clone and install

```bash
cd yaadai
npm install
```

### Step 3: Set up Supabase (free)

1. Go to https://supabase.com → Create new project (free)
2. Go to **SQL Editor** and run this:

```sql
-- Create the screenshots table
create table screenshots (
  id uuid default gen_random_uuid() primary key,
  image_url text,
  extracted_text text,
  category text default 'General',
  created_at timestamp with time zone default now(),
  is_deleted boolean default false
);

-- Enable RLS
alter table screenshots enable row level security;
create policy "Allow all" on screenshots for all using (true);

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true);

create policy "Allow uploads" on storage.objects
for insert with check (bucket_id = 'screenshots');

create policy "Allow reads" on storage.objects
for select using (bucket_id = 'screenshots');
```

3. Go to **Project Settings → API**
4. Copy **Project URL** and **anon/public key**
5. Paste them in `src/lib/supabase.ts`

### Step 4: Set up EAS (for native OCR build)

OCR uses Google ML Kit which needs native code. You need to build a dev client:

```bash
# Login to Expo account (free)
eas login

# Configure EAS in project
eas build:configure

# Build dev client for Android (free tier: 30 builds/month)
eas build --platform android --profile development

# OR for iOS (needs Apple developer account)
eas build --platform ios --profile development
```

### Step 5: Run the app

```bash
# Start dev server
npx expo start

# Scan QR code with your custom dev client (not regular Expo Go)
```

---

## File structure

```
yaadai/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Home
│   ├── upload.tsx          # Upload
│   ├── library.tsx         # Library
│   ├── search.tsx          # Search
│   └── detail.tsx          # Detail view
├── src/
│   ├── screens/            # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── DetailScreen.tsx
│   ├── hooks/
│   │   └── useOCR.ts       # OCR + upload logic
│   └── lib/
│       ├── supabase.ts     # ← PASTE YOUR KEYS HERE
│       ├── db.ts           # Database operations
│       └── categorizer.ts  # Free keyword categorizer
├── app.json
├── package.json
└── babel.config.js
```

---

## Categories supported (auto-detected)

- DSA & Algorithms
- System Design
- Interview Questions
- Job Description
- React & Frontend
- Backend & APIs
- Database
- DevOps & Cloud
- Machine Learning
- Mathematics
- Language & Grammar
- Finance & Business
- Health & Fitness
- Recipes & Food
- General Notes

---

## Phase 2 (coming next)

- AI Q&A — ask questions about your notes
- Daily quiz generator
- Spaced repetition
- Follow-up conversations per note
