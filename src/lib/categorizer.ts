// src/lib/categorizer.ts
// ─────────────────────────────────────────────────────────────
// 100% FREE keyword-based categorizer.
// No API key, no internet call, runs instantly on-device.
// Covers the most common screenshot types people save.
// ─────────────────────────────────────────────────────────────

type Category =
  | 'DSA & Algorithms'
  | 'System Design'
  | 'Interview Questions'
  | 'Job Description'
  | 'React & Frontend'
  | 'Backend & APIs'
  | 'Database'
  | 'DevOps & Cloud'
  | 'Machine Learning'
  | 'Mathematics'
  | 'Language & Grammar'
  | 'Finance & Business'
  | 'Health & Fitness'
  | 'Recipes & Food'
  | 'General Notes';

interface CategoryRule {
  category: Category;
  keywords: string[];
}

const RULES: CategoryRule[] = [
  {
    category: 'DSA & Algorithms',
    keywords: [
      'array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'binary search',
      'dynamic programming', 'dp', 'recursion', 'sorting', 'hash map', 'hashmap',
      'big o', 'time complexity', 'space complexity', 'bfs', 'dfs', 'heap',
      'trie', 'backtracking', 'greedy', 'two pointer', 'sliding window',
      'leetcode', 'algorithm', 'data structure',
    ],
  },
  {
    category: 'System Design',
    keywords: [
      'system design', 'scalability', 'load balancer', 'cdn', 'cache', 'redis',
      'kafka', 'message queue', 'microservices', 'api gateway', 'sharding',
      'replication', 'consistency', 'availability', 'cap theorem', 'sql vs nosql',
      'rate limiting', 'horizontal scaling', 'vertical scaling', 'database design',
      'distributed system', 'fault tolerance',
    ],
  },
  {
    category: 'Interview Questions',
    keywords: [
      'interview', 'tell me about yourself', 'strengths', 'weaknesses',
      'why do you want', 'behavioral', 'situation task action result', 'star method',
      'what is your', 'how would you', 'explain the difference', 'what are',
      'describe a time', 'technical round', 'hr round', 'coding round',
    ],
  },
  {
    category: 'Job Description',
    keywords: [
      'job description', 'responsibilities', 'requirements', 'qualifications',
      'experience required', 'salary', 'lpa', 'ctc', 'apply now', 'years of experience',
      'we are looking for', 'must have', 'nice to have', 'benefits',
      'remote', 'hybrid', 'on-site', 'full time', 'part time', 'internship',
      'openings', 'hiring', 'vacancy',
    ],
  },
  {
    category: 'React & Frontend',
    keywords: [
      'react', 'usestate', 'useeffect', 'usememo', 'usecallback', 'useref',
      'component', 'props', 'jsx', 'hooks', 'context', 'redux', 'zustand',
      'css', 'html', 'javascript', 'typescript', 'dom', 'event listener',
      'next.js', 'vue', 'angular', 'tailwind', 'styled components', 'webpack',
      'vite', 'npm', 'frontend',
    ],
  },
  {
    category: 'Backend & APIs',
    keywords: [
      'api', 'rest', 'graphql', 'node.js', 'express', 'fastapi', 'django',
      'spring boot', 'http', 'get', 'post', 'put', 'delete', 'endpoint',
      'middleware', 'authentication', 'jwt', 'oauth', 'cors', 'webhook',
      'server', 'backend', 'python', 'java', 'golang', 'rust',
    ],
  },
  {
    category: 'Database',
    keywords: [
      'sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'query', 'join',
      'index', 'primary key', 'foreign key', 'transaction', 'acid',
      'select', 'insert', 'update', 'delete', 'schema', 'normalization',
      'supabase', 'firebase', 'dynamodb', 'orm', 'prisma',
    ],
  },
  {
    category: 'DevOps & Cloud',
    keywords: [
      'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'pipeline',
      'deployment', 'jenkins', 'github actions', 'terraform', 'ansible',
      'linux', 'bash', 'shell', 'nginx', 'ssl', 'https', 'monitoring',
      'logging', 'devops', 'cloud', 'serverless',
    ],
  },
  {
    category: 'Machine Learning',
    keywords: [
      'machine learning', 'deep learning', 'neural network', 'model',
      'training', 'dataset', 'accuracy', 'loss function', 'gradient descent',
      'overfitting', 'underfitting', 'classification', 'regression',
      'clustering', 'tensorflow', 'pytorch', 'scikit', 'nlp', 'llm',
      'transformer', 'gpt', 'ai', 'artificial intelligence',
    ],
  },
  {
    category: 'Mathematics',
    keywords: [
      'equation', 'formula', 'theorem', 'proof', 'calculus', 'derivative',
      'integral', 'matrix', 'vector', 'probability', 'statistics', 'mean',
      'median', 'standard deviation', 'trigonometry', 'algebra', 'geometry',
      'permutation', 'combination', 'set theory',
    ],
  },
  {
    category: 'Finance & Business',
    keywords: [
      'revenue', 'profit', 'loss', 'balance sheet', 'investment', 'stock',
      'mutual fund', 'sip', 'nifty', 'sensex', 'ipo', 'roi', 'budget',
      'tax', 'gst', 'startup', 'business model', 'marketing', 'sales',
      'customer', 'product market fit',
    ],
  },
  {
    category: 'Health & Fitness',
    keywords: [
      'workout', 'exercise', 'calories', 'protein', 'diet', 'gym', 'yoga',
      'meditation', 'sleep', 'weight loss', 'muscle', 'cardio', 'nutrition',
      'vitamin', 'supplement', 'fitness', 'health', 'mental health',
      'anxiety', 'depression', 'therapy',
    ],
  },
  {
    category: 'Recipes & Food',
    keywords: [
      'recipe', 'ingredients', 'cook', 'bake', 'fry', 'boil', 'tablespoon',
      'teaspoon', 'cup', 'grams', 'minutes', 'oven', 'temperature', 'serve',
      'mix', 'stir', 'chop', 'marinate', 'masala', 'spice',
    ],
  },
  {
    category: 'Language & Grammar',
    keywords: [
      'grammar', 'vocabulary', 'synonym', 'antonym', 'noun', 'verb', 'adjective',
      'sentence', 'paragraph', 'essay', 'spelling', 'pronunciation', 'ielts',
      'toefl', 'english', 'meaning of', 'definition', 'word',
    ],
  },
];

export function categorize(text: string): Category {
  if (!text || text.trim().length < 10) return 'General Notes';

  const lower = text.toLowerCase();
  const scores: Partial<Record<Category, number>> = {};

  for (const rule of RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        // Longer/more specific keywords get higher weight
        score += keyword.split(' ').length;
      }
    }
    if (score > 0) scores[rule.category] = score;
  }

  if (Object.keys(scores).length === 0) return 'General Notes';

  // Return the category with the highest score
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[0] as Category;
}

export const ALL_CATEGORIES: Category[] = [
  'DSA & Algorithms',
  'System Design',
  'Interview Questions',
  'Job Description',
  'React & Frontend',
  'Backend & APIs',
  'Database',
  'DevOps & Cloud',
  'Machine Learning',
  'Mathematics',
  'Language & Grammar',
  'Finance & Business',
  'Health & Fitness',
  'Recipes & Food',
  'General Notes',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'DSA & Algorithms': '#6C63FF',
  'System Design': '#E91E8C',
  'Interview Questions': '#FF6B35',
  'Job Description': '#00BFA5',
  'React & Frontend': '#61DAFB',
  'Backend & APIs': '#68D391',
  'Database': '#F6AD55',
  'DevOps & Cloud': '#90CDF4',
  'Machine Learning': '#B794F4',
  'Mathematics': '#FC8181',
  'Language & Grammar': '#68D391',
  'Finance & Business': '#F6E05E',
  'Health & Fitness': '#9AE6B4',
  'Recipes & Food': '#FBD38D',
  'General Notes': '#CBD5E0',
};
