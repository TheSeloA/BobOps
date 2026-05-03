# BobOps Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static BobOps dashboard into a full local web app where users chat with Bob AI to plan a project, then see the analysis on the existing dashboard.

**Architecture:** All new functionality lives inside the existing Next.js 16 project. Library modules (`storage`, `skill-loader`, `bob-client`) handle I/O. API routes handle the Bob conversation and file persistence. Three new planner components handle the chat UI. The existing dashboard components are untouched — they just receive real data instead of mock data.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node.js built-in `fetch` + `ReadableStream` for SSE, `node:fs/promises` for JSON file storage, `node:os` for `~/.bob/skills/` path.

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `lib/planning-analysis.js` | Create (copy) | Analyse Bob's plan output — unchanged from bobops project |
| `lib/planning-analysis.d.ts` | Create | TypeScript type declarations for planning-analysis.js |
| `lib/storage.ts` | Create | Read/write conversations and analyses as JSON files in `data/` |
| `lib/skill-loader.ts` | Create | Load SKILL.md files from `~/.bob/skills/` |
| `lib/bob-client.ts` | Create | Call Bob API with SSE streaming |
| `app/api/chat/route.ts` | Create | POST: start conversation, stream Bob's first response |
| `app/api/chat/[id]/message/route.ts` | Create | POST: send user message, stream Bob reply |
| `app/api/chat/[id]/finalize/route.ts` | Create | POST: generate plan, stream, run analyzePlan, save |
| `app/api/analyses/route.ts` | Create | GET: list all saved analyses |
| `app/api/analyses/[id]/route.ts` | Create | GET: load one saved analysis |
| `components/planner/message-bubble.tsx` | Create | Single chat message (user or Bob) with streaming support |
| `components/planner/past-analyses-list.tsx` | Create | Clickable list of past analyses on home screen |
| `components/planner/chat-screen.tsx` | Create | Full chat UI — orchestrates streaming, input, navigation |
| `app/page.tsx` | Replace | Home: idle state (idea input + past analyses) or active (chat) |
| `app/analysis/[id]/page.tsx` | Create | Server component: loads real analysis, renders Dashboard |
| `components/dashboard/sidebar.tsx` | Modify | Add "← New Analysis" link when `showBack` prop is true |
| `.env.local` | Create | Bob API credentials (gitignored by Next.js) |
| `data/` | Create | Gitignored runtime storage for conversations and analyses |

---

## Task 1: Project setup

**Files:**
- Create: `.env.local`
- Create: `data/conversations/.gitkeep`
- Create: `data/analyses/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.local`**

```
BOBSHELL_API_KEY=bob_prod_bob-apikey_<your-key>
BOB_INSTANCE_ID=<API_KEY>
BOB_TEAM_ID=<API_KEY>
```

- [ ] **Step 2: Create data directories**

```bash
mkdir -p data/conversations data/analyses
touch data/conversations/.gitkeep data/analyses/.gitkeep
```

- [ ] **Step 3: Add data/ to .gitignore**

Open `.gitignore` and add at the bottom:

```
# Runtime data
data/conversations/
data/analyses/
```

- [ ] **Step 4: Verify pnpm install works**

```bash
pnpm install
```

Expected: dependencies install, no errors.

- [ ] **Step 5: Commit**

```bash
git add .gitignore data/
git commit -m "chore: add env template and data directories"
```

---

## Task 2: `lib/planning-analysis.js` + type declaration

**Files:**
- Create: `lib/planning-analysis.js`
- Create: `lib/planning-analysis.d.ts`

- [ ] **Step 1: Copy planning-analysis.js**

Copy `C:\Users\selma\bobops\planning-analysis.js` to `C:\Users\selma\Downloads\b_qi9a5DeONHl\lib\planning-analysis.js`.

Do not modify the file — it is used verbatim.

- [ ] **Step 2: Create type declaration file**

Create `lib/planning-analysis.d.ts`:

```typescript
export interface ThreePointHours {
  optimistic: number;
  expected: number;
  pessimistic: number;
}

export interface CostEstimate {
  keywordsFound: string[];
  confidence: 'high' | 'medium' | 'low';
  hours: ThreePointHours;
  cost: { low: number; expected: number; high: number };
  hourlyRate: number;
  riskBufferPercent: number;
}

export interface RiskWarning {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export interface Scope {
  mvpFeatures: string[];
  fullVersionFeatures: string[];
  expensiveFeatures: string[];
  riskWarnings: RiskWarning[];
  suggestedBuildOrder: string[];
  costSavingTips: string[];
  taskCount: number;
  parsedFromDocument: boolean;
}

export interface AnalysisResult {
  finalPlan: string;
  parsedFromJson: boolean;
  parsedFromDocument: boolean;
  jsonBlock: object | null;
  keywords: string[];
  costEstimate: CostEstimate;
  scope: Scope;
  openQuestions: string[];
  taskCount: number;
  report: string;
}

export interface TranscriptMessage {
  role: string;
  content: string;
  created_at: string;
  initial?: boolean;
}

export interface AnalysisPayload {
  source: string;
  transcript: TranscriptMessage[];
}

export function extractFinalPlan(transcript: TranscriptMessage[]): string;
export function analyzePlan(payload: AnalysisPayload): AnalysisResult;
```

- [ ] **Step 3: Smoke-test the import**

Create `lib/_smoke-test.mjs` temporarily:

```js
import { analyzePlan } from './planning-analysis.js';
const r = analyzePlan({
  source: 'test',
  transcript: [{ role: 'bob', content: 'A login and dashboard app', created_at: new Date().toISOString() }]
});
console.assert(r.keywords.includes('login'), 'should detect login');
console.log('OK — keywords:', r.keywords);
```

Run:
```bash
node lib/_smoke-test.mjs
```

Expected:
```
OK — keywords: [ 'login', 'dashboard' ]
```

- [ ] **Step 4: Delete smoke test and commit**

```bash
rm lib/_smoke-test.mjs
git add lib/planning-analysis.js lib/planning-analysis.d.ts
git commit -m "feat: add planning-analysis module with type declarations"
```

---

## Task 3: `lib/storage.ts`

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Write a Node test to verify storage works**

Create `lib/_storage-test.mjs`:

```js
import { writeFile, rm } from 'node:fs/promises';

// Temporarily patch env so storage.ts uses a test dir
// We'll test by running: node --experimental-vm-modules lib/_storage-test.mjs
// But since storage.ts is TypeScript, test manually via pnpm dev instead.
// This file is just a reminder — delete after Task 3 is done.
console.log('Storage module is tested via integration (pnpm dev).');
```

Actually, because `storage.ts` is TypeScript compiled by Next.js, verify it via the running server (Task 17). Delete the file and proceed.

```bash
rm lib/_storage-test.mjs
```

- [ ] **Step 2: Implement `lib/storage.ts`**

```typescript
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const DATA_DIR = join(process.cwd(), 'data');
const CONV_DIR = join(DATA_DIR, 'conversations');
const ANAL_DIR = join(DATA_DIR, 'analyses');

async function ensureDirs() {
  await mkdir(CONV_DIR, { recursive: true });
  await mkdir(ANAL_DIR, { recursive: true });
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationFile {
  id: string;
  idea: string;
  createdAt: string;
  messages: ConversationMessage[];
}

export interface SavedAnalysis {
  id: string;
  idea: string;
  createdAt: string;
  finalPlan: string;
  parsedFromJson: boolean;
  parsedFromDocument: boolean;
  jsonBlock: object | null;
  keywords: string[];
  costEstimate: import('./planning-analysis').CostEstimate;
  scope: import('./planning-analysis').Scope;
  openQuestions: string[];
  taskCount: number;
  report: string;
}

export interface AnalysisMeta {
  id: string;
  idea: string;
  createdAt: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function saveConversation(conv: ConversationFile): Promise<void> {
  await ensureDirs();
  await writeFile(join(CONV_DIR, `${conv.id}.json`), JSON.stringify(conv, null, 2));
}

export async function loadConversation(id: string): Promise<ConversationFile | null> {
  try {
    const raw = await readFile(join(CONV_DIR, `${id}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveAnalysis(analysis: SavedAnalysis): Promise<void> {
  await ensureDirs();
  await writeFile(join(ANAL_DIR, `${analysis.id}.json`), JSON.stringify(analysis, null, 2));
}

export async function loadAnalysis(id: string): Promise<SavedAnalysis | null> {
  try {
    const raw = await readFile(join(ANAL_DIR, `${id}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listAnalyses(): Promise<AnalysisMeta[]> {
  await ensureDirs();
  let files: string[];
  try {
    files = await readdir(ANAL_DIR);
  } catch {
    return [];
  }
  const results: AnalysisMeta[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(join(ANAL_DIR, file), 'utf8');
      const data: SavedAnalysis = JSON.parse(raw);
      results.push({
        id: data.id,
        idea: data.idea,
        createdAt: data.createdAt,
        confidence: data.costEstimate.confidence,
      });
    } catch { /* skip malformed files */ }
  }
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add storage module for conversations and analyses"
```

---

## Task 4: `lib/skill-loader.ts`

**Files:**
- Create: `lib/skill-loader.ts`

- [ ] **Step 1: Implement `lib/skill-loader.ts`**

```typescript
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SKILLS_DIR = join(homedir(), '.bob', 'skills');
const PLANNING_SKILLS = ['plan-request', 'brainstorming', 'writing-plans'] as const;

const TOOL_DIRECTIVE = `## IMPORTANT: Environment Constraints

You are running inside a browser-based chat UI. You MUST:
- NOT use any tools, MCP servers, or file system access — none are available
- NOT offer a visual companion or browser features
- Ask clarifying questions — the user is present and will answer in the chat
- When you have enough information, generate the complete implementation and design plan`;

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content.trim();
  const end = content.indexOf('\n---', 3);
  if (end === -1) return content.trim();
  return content.slice(end + 4).trim();
}

async function loadSkill(name: string): Promise<string> {
  try {
    const path = join(SKILLS_DIR, name, 'SKILL.md');
    const raw = await readFile(path, 'utf8');
    return stripFrontmatter(raw);
  } catch {
    return '';
  }
}

export async function buildSystemPrompt(): Promise<string> {
  const skills = await Promise.all(PLANNING_SKILLS.map(loadSkill));
  const skillsContent = skills.filter(Boolean).join('\n\n---\n\n');
  return `${TOOL_DIRECTIVE}\n\n---\n\n${skillsContent}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/skill-loader.ts
git commit -m "feat: add skill-loader module"
```

---

## Task 5: `lib/bob-client.ts`

**Files:**
- Create: `lib/bob-client.ts`

- [ ] **Step 1: Implement `lib/bob-client.ts`**

```typescript
const BOB_API_URL = 'https://api.us-east.bob.ibm.com/inference/v1/chat/completions';

export interface BobMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callBobStream(
  messages: BobMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = process.env.BOBSHELL_API_KEY;
  const instanceId = process.env.BOB_INSTANCE_ID;
  const teamId = process.env.BOB_TEAM_ID;

  if (!apiKey || !instanceId || !teamId) {
    throw new Error('Missing Bob API credentials. Check BOBSHELL_API_KEY, BOB_INSTANCE_ID, BOB_TEAM_ID in .env.local');
  }

  const response = await fetch(BOB_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Apikey ${apiKey}`,
      'x-instance-id': instanceId,
      'x-team-id': teamId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'premium', stream: true, messages }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bob API error ${response.status}: ${body}`);
  }

  let fullText = '';
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        const chunk: string = parsed?.choices?.[0]?.delta?.content ?? '';
        if (chunk) {
          onChunk(chunk);
          fullText += chunk;
        }
      } catch { /* skip malformed chunks */ }
    }
  }

  if (!fullText.trim()) {
    throw new Error('Bob returned an empty response');
  }

  return fullText;
}

export function hasMissingCredentials(): boolean {
  return !process.env.BOBSHELL_API_KEY || !process.env.BOB_INSTANCE_ID || !process.env.BOB_TEAM_ID;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/bob-client.ts
git commit -m "feat: add bob-client module with SSE streaming"
```

---

## Task 6: `app/api/chat/route.ts` — start conversation

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Implement the route**

```typescript
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { buildSystemPrompt } from '@/lib/skill-loader';
import { saveConversation } from '@/lib/storage';
import { callBobStream, hasMissingCredentials } from '@/lib/bob-client';
import type { BobMessage } from '@/lib/bob-client';

export async function POST(req: NextRequest) {
  if (hasMissingCredentials()) {
    return new Response(
      JSON.stringify({ error: 'Bob API credentials not configured. Add them to .env.local' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { idea } = await req.json() as { idea: string };
  if (!idea?.trim()) {
    return new Response(JSON.stringify({ error: 'idea is required' }), { status: 400 });
  }

  const id = randomUUID();
  const systemPrompt = await buildSystemPrompt();

  const messages: BobMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Idea: ${idea.trim()}` },
  ];

  await saveConversation({ id, idea: idea.trim(), createdAt: new Date().toISOString(), messages });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: 'id', value: id });

      try {
        let fullText = '';
        fullText = await callBobStream(messages, (chunk) => send({ type: 'chunk', content: chunk }));

        // Save Bob's first reply to conversation
        const conv = { id, idea: idea.trim(), createdAt: new Date().toISOString(), messages };
        conv.messages.push({ role: 'assistant', content: fullText });
        await saveConversation(conv);

        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Manual smoke test**

```bash
pnpm dev
```

In a second terminal:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"idea":"a simple todo app"}' \
  --no-buffer
```

Expected: SSE stream with `{"type":"id","value":"..."}` then chunks then `{"type":"done"}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add POST /api/chat — start conversation with Bob"
```

---

## Task 7: `app/api/chat/[id]/message/route.ts`

**Files:**
- Create: `app/api/chat/[id]/message/route.ts`

- [ ] **Step 1: Implement the route**

```typescript
import { NextRequest } from 'next/server';
import { loadConversation, saveConversation } from '@/lib/storage';
import { callBobStream } from '@/lib/bob-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await req.json() as { content: string };

  const conv = await loadConversation(id);
  if (!conv) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  conv.messages.push({ role: 'user', content: content.trim() });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        let fullText = '';
        fullText = await callBobStream(conv.messages, (chunk) => send({ type: 'chunk', content: chunk }));

        conv.messages.push({ role: 'assistant', content: fullText });
        await saveConversation(conv);

        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/[id]/message/route.ts
git commit -m "feat: add POST /api/chat/[id]/message — send user reply"
```

---

## Task 8: `app/api/chat/[id]/finalize/route.ts`

**Files:**
- Create: `app/api/chat/[id]/finalize/route.ts`

- [ ] **Step 1: Implement the route**

```typescript
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { loadConversation, saveAnalysis } from '@/lib/storage';
import { callBobStream } from '@/lib/bob-client';
import { analyzePlan } from '@/lib/planning-analysis';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conv = await loadConversation(id);
  if (!conv) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  const finalMessages = [
    ...conv.messages,
    {
      role: 'user' as const,
      content: 'Please generate the complete implementation and design plan now based on everything we have discussed.',
    },
  ];

  const encoder = new TextEncoder();
  const analysisId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        let planText = '';
        planText = await callBobStream(finalMessages, (chunk) => send({ type: 'chunk', content: chunk }));

        const result = analyzePlan({
          source: 'web',
          transcript: [{ role: 'bob', content: planText, created_at: new Date().toISOString() }],
        });

        await saveAnalysis({
          id: analysisId,
          idea: conv.idea,
          createdAt: new Date().toISOString(),
          ...result,
        });

        send({ type: 'analysisId', value: analysisId });
        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/[id]/finalize/route.ts
git commit -m "feat: add POST /api/chat/[id]/finalize — generate plan and save analysis"
```

---

## Task 9: `app/api/analyses/route.ts` and `app/api/analyses/[id]/route.ts`

**Files:**
- Create: `app/api/analyses/route.ts`
- Create: `app/api/analyses/[id]/route.ts`

- [ ] **Step 1: Implement `app/api/analyses/route.ts`**

```typescript
import { listAnalyses } from '@/lib/storage';

export async function GET() {
  const analyses = await listAnalyses();
  return Response.json({ analyses });
}
```

- [ ] **Step 2: Implement `app/api/analyses/[id]/route.ts`**

```typescript
import { NextRequest } from 'next/server';
import { loadAnalysis } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const analysis = await loadAnalysis(id);
  if (!analysis) {
    return new Response(JSON.stringify({ error: 'Analysis not found' }), { status: 404 });
  }
  return Response.json(analysis);
}
```

- [ ] **Step 3: Manual smoke test**

With `pnpm dev` running:
```bash
curl http://localhost:3000/api/analyses
```
Expected: `{"analyses":[]}` (empty list initially).

- [ ] **Step 4: Commit**

```bash
git add app/api/analyses/
git commit -m "feat: add GET /api/analyses and /api/analyses/[id]"
```

---

## Task 10: `components/planner/message-bubble.tsx`

**Files:**
- Create: `components/planner/message-bubble.tsx`

- [ ] **Step 1: Implement the component**

```typescript
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming = false }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-[#9f1239] flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
        ) : (
          <Image
            src="/bob-mascot.png"
            alt="Bob"
            width={32}
            height={32}
            className="rounded-lg"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[#9f1239] text-white rounded-tr-sm'
            : 'bg-[#1e293b] text-slate-200 border border-[#3b4f6b] rounded-tl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse align-text-bottom" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/planner/message-bubble.tsx
git commit -m "feat: add MessageBubble component"
```

---

## Task 11: `components/planner/past-analyses-list.tsx`

**Files:**
- Create: `components/planner/past-analyses-list.tsx`

- [ ] **Step 1: Implement the component**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisMeta {
  id: string;
  idea: string;
  createdAt: string;
  confidence: 'high' | 'medium' | 'low';
}

interface PastAnalysesListProps {
  analyses: AnalysisMeta[];
}

const confidenceColors = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export function PastAnalysesList({ analyses }: PastAnalysesListProps) {
  const router = useRouter();

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No past analyses yet. Start one above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        Past Analyses
      </h2>
      {analyses.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(`/analysis/${item.id}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1e293b] border border-[#3b4f6b] hover:border-[#3b82f6] transition-colors text-left group"
        >
          <BarChart3 className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{item.idea}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0',
              confidenceColors[item.confidence]
            )}
          >
            {item.confidence.toUpperCase()}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/planner/past-analyses-list.tsx
git commit -m "feat: add PastAnalysesList component"
```

---

## Task 12: `components/planner/chat-screen.tsx`

**Files:**
- Create: `components/planner/chat-screen.tsx`

- [ ] **Step 1: Implement the component**

```typescript
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatScreenProps {
  idea: string;
}

async function readSSEStream(
  response: Response,
  onChunk: (chunk: string) => void,
  onId?: (id: string) => void,
  onAnalysisId?: (id: string) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk') onChunk(data.content);
        if (data.type === 'id' && onId) onId(data.value);
        if (data.type === 'analysisId' && onAnalysisId) onAnalysisId(data.value);
        if (data.type === 'error') throw new Error(data.message);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

export function ChatScreen({ idea }: ChatScreenProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const appendChunk = useCallback((chunk: string) => {
    setStreamingText((prev) => prev + chunk);
  }, []);

  const commitStreamingMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    setStreamingText('');
  }, []);

  const finalize = useCallback(async (id: string) => {
    setIsFinalizing(true);
    setIsStreaming(true);
    setStreamingText('');
    let planText = '';
    let analysisId = '';

    try {
      const res = await fetch(`/api/chat/${id}/finalize`, { method: 'POST' });
      await readSSEStream(
        res,
        (chunk) => { appendChunk(chunk); planText += chunk; },
        undefined,
        (aId) => { analysisId = aId; }
      );
      commitStreamingMessage(planText);
      if (analysisId) router.push(`/analysis/${analysisId}`);
    } catch (err) {
      commitStreamingMessage(`Error: ${err instanceof Error ? err.message : 'Failed to generate plan'}`);
    } finally {
      setIsStreaming(false);
      setIsFinalizing(false);
    }
  }, [appendChunk, commitStreamingMessage, router]);

  // Start conversation on mount
  useEffect(() => {
    let cancelled = false;
    async function startConversation() {
      setIsStreaming(true);
      let bobText = '';
      let convId = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea }),
        });
        await readSSEStream(
          res,
          (chunk) => { if (!cancelled) { appendChunk(chunk); bobText += chunk; } },
          (id) => { convId = id; conversationIdRef.current = id; }
        );
        if (!cancelled) {
          commitStreamingMessage(bobText);
          // Auto-finalize if Bob's reply looks like a complete plan
          const looksLikePlan = bobText.length > 800 && /#{1,3}\s+\w/.test(bobText);
          if (looksLikePlan && convId) finalize(convId);
        }
      } catch (err) {
        if (!cancelled) commitStreamingMessage(`Error: ${err instanceof Error ? err.message : 'Failed to connect to Bob'}`);
      } finally {
        if (!cancelled) setIsStreaming(false);
      }
    }
    startConversation();
    return () => { cancelled = true; };
  }, [idea, appendChunk, commitStreamingMessage, finalize]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming || !conversationIdRef.current) return;
    const id = conversationIdRef.current;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInputValue('');
    setIsStreaming(true);

    let bobText = '';
    try {
      const res = await fetch(`/api/chat/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      await readSSEStream(res, (chunk) => { appendChunk(chunk); bobText += chunk; });
      commitStreamingMessage(bobText);
      // Auto-finalize if Bob's reply looks like a complete plan
      const looksLikePlan = bobText.length > 800 && /#{1,3}\s+\w/.test(bobText);
      if (looksLikePlan) finalize(id);
    } catch (err) {
      commitStreamingMessage(`Error: ${err instanceof Error ? err.message : 'Failed to send message'}`);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Compact idea header */}
      <div className="px-4 py-3 border-b border-[#3b4f6b] bg-[#1e293b]">
        <p className="text-sm text-slate-400">Planning: <span className="text-white font-medium">{idea}</span></p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {streamingText && (
          <MessageBubble role="assistant" content={streamingText} isStreaming />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-[#3b4f6b] bg-[#1e293b]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); } }}
            placeholder={isStreaming ? 'Bob is thinking...' : 'Type your answer...'}
            disabled={isStreaming}
            className="flex-1 bg-[#0f172a] border border-[#3b4f6b] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={isStreaming || !inputValue.trim()}
            className="p-2.5 bg-[#3b82f6] rounded-xl text-white disabled:opacity-50 hover:bg-[#2563eb] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={() => conversationIdRef.current && finalize(conversationIdRef.current)}
            disabled={isStreaming || isFinalizing || !conversationIdRef.current}
            title="Generate plan now"
            className={cn(
              'p-2.5 rounded-xl text-white transition-colors',
              isFinalizing
                ? 'bg-[#9f1239] opacity-50'
                : 'bg-[#9f1239] hover:bg-[#be123c] disabled:opacity-50'
            )}
          >
            {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/planner/chat-screen.tsx
git commit -m "feat: add ChatScreen component with SSE streaming and auto-finalization"
```

---

## Task 13: `app/page.tsx` — home page

**Files:**
- Modify: `app/page.tsx` (replace entirely)

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
import { Suspense } from 'react';
import { PlannerHome } from '@/components/planner/planner-home';
import { listAnalyses } from '@/lib/storage';
import { hasMissingCredentials } from '@/lib/bob-client';

export default async function Page() {
  const [analyses, missingCreds] = await Promise.all([
    listAnalyses(),
    Promise.resolve(hasMissingCredentials()),
  ]);

  return (
    <Suspense>
      <PlannerHome analyses={analyses} missingCredentials={missingCreds} />
    </Suspense>
  );
}
```

- [ ] **Step 2: Create `components/planner/planner-home.tsx`**

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Send, AlertTriangle } from 'lucide-react';
import { PastAnalysesList } from './past-analyses-list';
import { ChatScreen } from './chat-screen';

interface AnalysisMeta {
  id: string;
  idea: string;
  createdAt: string;
  confidence: 'high' | 'medium' | 'low';
}

interface PlannerHomeProps {
  analyses: AnalysisMeta[];
  missingCredentials: boolean;
}

export function PlannerHome({ analyses, missingCredentials }: PlannerHomeProps) {
  const [activeIdea, setActiveIdea] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  if (activeIdea) {
    return <div className="h-screen"><ChatScreen idea={activeIdea} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-start px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <Image src="/bob-mascot.png" alt="BobOps" width={64} height={64} className="rounded-2xl mb-4" />
          <h1 className="text-3xl font-bold text-white">BobOps</h1>
          <p className="text-slate-400 mt-2 text-center">
            Describe your app idea and Bob will plan it with you
          </p>
        </div>

        {/* Missing credentials banner */}
        {missingCredentials && (
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Bob API credentials not configured — add them to <code className="font-mono">.env.local</code>
          </div>
        )}

        {/* Idea input */}
        <div className="flex gap-2 mb-10">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) setActiveIdea(inputValue.trim());
            }}
            placeholder="e.g. A room booking app for co-working spaces..."
            disabled={missingCredentials}
            className="flex-1 bg-[#1e293b] border border-[#3b4f6b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 text-sm"
          />
          <button
            onClick={() => { if (inputValue.trim()) setActiveIdea(inputValue.trim()); }}
            disabled={missingCredentials || !inputValue.trim()}
            className="px-4 py-3 bg-[#3b82f6] rounded-xl text-white disabled:opacity-50 hover:bg-[#2563eb] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Past analyses */}
        <PastAnalysesList analyses={analyses} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx components/planner/planner-home.tsx
git commit -m "feat: add home page with idea input and past analyses list"
```

---

## Task 14: `app/analysis/[id]/page.tsx`

**Files:**
- Create: `app/analysis/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { notFound } from 'next/navigation';
import { loadAnalysis } from '@/lib/storage';
import { Dashboard } from '@/components/dashboard/dashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params;
  const saved = await loadAnalysis(id);
  if (!saved) notFound();

  // Strip envelope fields — pass only AnalysisResult shape to Dashboard
  const { id: _id, idea: _idea, createdAt: _createdAt, ...analysisResult } = saved;

  return <Dashboard data={analysisResult} showBack />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/analysis/
git commit -m "feat: add /analysis/[id] page — loads real analysis data"
```

---

## Task 15: Update `Dashboard` and `Sidebar` to accept `showBack` and `data` props

The existing `Dashboard` component hardcodes `mockAnalysisResult`. We need to make it accept a `data` prop and pass it through, plus optionally show a back link.

**Files:**
- Modify: `components/dashboard/dashboard.tsx`
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Step 1: Update `components/dashboard/dashboard.tsx`**

Replace the file with:

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "./sidebar";
import { DashboardContent } from "./dashboard-content";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/mock-data";

interface DashboardProps {
  data: AnalysisResult;
  showBack?: boolean;
}

export function Dashboard({ data, showBack = false }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f172a]">
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setSidebarOpen(false);
          }}
          showBack={showBack}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#3b4f6b] bg-[#1e293b]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[#1e3a5f]">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Image src="/bob-mascot.png" alt="BobOps" width={28} height={28} className="rounded-md" />
            <span className="font-semibold text-white">BobOps</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={cn("p-2 rounded-lg hover:bg-[#1e3a5f]", !sidebarOpen && "invisible")}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </header>
        <DashboardContent activeSection={activeSection} data={data} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `components/dashboard/sidebar.tsx`**

Add `showBack` prop and replace the footer "Analysis Complete" section with a conditional back link:

```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, AlertTriangle, Layers, Lightbulb, FileText, ChevronRight, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  showBack?: boolean;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "features", label: "Features", icon: Layers },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "report", label: "Full Report", icon: FileText },
];

export function Sidebar({ activeSection, onSectionChange, showBack = false }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Image src="/bob-mascot.png" alt="BobOps mascot" width={40} height={40} className="rounded-lg" />
          <span className="font-semibold text-white">BobOps</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
          Analysis
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#9f1239] text-white"
                      : "text-slate-400 hover:text-white hover:bg-[#1e3a5f]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {showBack ? (
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span className="text-xs text-slate-300">New Analysis</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e3a5f]">
            <Image src="/bob-mascot.png" alt="BobOps" width={20} height={20} className="rounded" />
            <span className="text-xs text-slate-300">Analysis Complete</span>
          </div>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/dashboard.tsx components/dashboard/sidebar.tsx
git commit -m "feat: make Dashboard accept data + showBack props, add New Analysis link"
```

---

## Task 16: End-to-end integration test

- [ ] **Step 1: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 2: Start the dev server**

```bash
pnpm dev
```

Expected: server starts on `http://localhost:3000` with no compilation errors.

- [ ] **Step 3: Test the home page**

Open `http://localhost:3000`. Expected:
- BobOps logo and title visible
- Idea input field and send button visible
- "No past analyses yet" message below

- [ ] **Step 4: Test starting a conversation**

Type `A simple todo app` in the input and press Enter or click Send. Expected:
- Page transitions to chat view
- Compact header shows the idea
- Bob's response streams in word-by-word as a bubble
- Input box appears at bottom after Bob finishes

- [ ] **Step 5: Answer Bob's questions**

Type a reply to Bob's question and press Enter. Expected:
- Your message appears as a user bubble (right-aligned, red)
- Bob streams a reply

- [ ] **Step 6: Generate the plan**

Either wait for Bob to auto-detect it has enough info, or click the ✨ (Sparkles) button. Expected:
- Bob streams a long plan with markdown headings
- Page auto-navigates to `/analysis/{id}`
- Dashboard shows real data (not mock data) — budget card, confidence badge, feature lists, etc.

- [ ] **Step 7: Test "← New Analysis" link**

Click "← New Analysis" in the sidebar. Expected:
- Navigates back to `/`
- Past analyses list shows the analysis you just created with the idea snippet and confidence badge

- [ ] **Step 8: Test loading a past analysis**

Click the analysis in the past analyses list. Expected:
- Navigates to `/analysis/{id}`
- Dashboard shows the same data as before

---

## Self-Review

**Spec coverage:**
- ✅ Home page: idle state (idea input + past analyses) and active (chat) → Tasks 13, 14
- ✅ Chat-like interface with streaming → Task 12
- ✅ Auto-navigate to dashboard → Task 12 (`router.push`)
- ✅ Save analyses as JSON files → Tasks 3, 8
- ✅ Past analyses listed on home screen → Task 11
- ✅ `POST /api/chat` → Task 6
- ✅ `POST /api/chat/[id]/message` → Task 7
- ✅ `POST /api/chat/[id]/finalize` → Task 8
- ✅ `GET /api/analyses` → Task 9
- ✅ `GET /api/analyses/[id]` → Task 9
- ✅ `lib/bob-client.ts` → Task 5
- ✅ `lib/skill-loader.ts` → Task 4
- ✅ `lib/storage.ts` → Task 3
- ✅ `lib/planning-analysis.js` + types → Task 2
- ✅ `/analysis/[id]` page with real data → Task 14
- ✅ Sidebar "← New Analysis" link → Task 15
- ✅ Missing credentials banner → Task 13
- ✅ SSE format `{"type":"chunk"}` / `{"type":"done"}` / `{"type":"analysisId"}` → Tasks 6–8
- ✅ Auto-finalization (800 chars + headings heuristic) → Task 12
- ✅ "Generate Plan" button → Task 12
- ✅ Analyses envelope: `id`, `idea`, `createdAt` stripped before passing to Dashboard → Task 14
