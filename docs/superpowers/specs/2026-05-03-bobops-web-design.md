# BobOps Web App — Design Spec

**Date:** 2026-05-03
**Status:** Approved
**Project:** `b_qi9a5DeONHl` (Next.js 16 / React 19 / TypeScript)

---

## Overview

Transform the existing static BobOps dashboard into a full local web application. The user types an app idea, has a chat conversation with Bob AI (IBM Watsonx) to refine it, Bob generates an implementation and design plan, `planning-analysis.js` analyses the plan, and the result is displayed on the existing dashboard. Past analyses are saved as JSON files and accessible from the home screen.

---

## Goals

- Replace the static mock-data dashboard with a live planning → analysis → display workflow
- Chat-like interface for the Bob AI conversation (streaming, word-by-word)
- Auto-navigate to the dashboard when the plan is ready
- Save each analysis as a JSON file; list past analyses on the home screen
- Single `pnpm dev` command to run everything locally
- Zero changes to existing `components/dashboard/` or `components/ui/` files

---

## Non-Goals

- No user accounts or authentication
- No cloud deployment (local only)
- No database — JSON files on disk only
- No multi-user support

---

## Pages

### `/` — Home / Planning screen

Two states on the same page:

**Idle state** (on first load):
- Large idea input field + submit button at the top
- List of past analyses below (idea snippet, date, confidence badge)
- Click any past analysis → navigate to `/analysis/{id}`

**Active chat state** (after idea is submitted):
- Input area slides up / collapses into a compact header showing the idea
- Chat view appears: Bob's messages stream in word-by-word
- User reply input at the bottom (disabled while Bob is responding)
- "Generate Plan" button alongside user input — triggers finalization at any time
- Auto-finalization: if Bob's reply is longer than 800 characters and contains markdown headings (`## `), the client treats it as a complete plan and automatically calls `/finalize` without the user needing to click the button
- When analysis is ready → auto-navigate to `/analysis/{id}`

### `/analysis/[id]` — Dashboard

Existing dashboard layout with real data. The page server-component loads `data/analyses/{id}.json` via `GET /api/analyses/[id]`, destructures out the envelope fields (`id`, `idea`, `createdAt`), and passes the remaining `AnalysisResult`-shaped data to the existing `Dashboard` component. A "← New Analysis" link in the sidebar footer replaces "Analysis Complete".

---

## API Routes

### `POST /api/chat`
Start a new conversation.
- Body: `{ idea: string }`
- Creates `data/conversations/{id}.json` with initial message history
- Returns: `{ id: string }`

### `POST /api/chat/[id]/message`
Send a user message and stream Bob's reply.
- Body: `{ content: string }`
- Appends user message to conversation file
- Calls Bob API with full message history, streams reply via SSE
- Appends Bob reply to conversation file when stream ends
- Returns: SSE stream

### `POST /api/chat/[id]/finalize`
Tell Bob to generate the final plan, run analysis, save result.
- Appends system instruction to generate the plan now
- Calls Bob API, streams reply via SSE
- When stream ends: runs `analyzePlan()`, saves `data/analyses/{id}.json`
- Returns SSE stream; final SSE event: `data: {"type":"done","analysisId":"..."}`

### `GET /api/analyses`
List past analyses for the home screen.
- Reads `data/analyses/` directory
- Returns: `{ analyses: Array<{ id, idea, createdAt, confidence }> }` sorted by date desc

### `GET /api/analyses/[id]`
Load a saved analysis.
- Reads `data/analyses/{id}.json`
- Returns the full saved object (including `id`, `idea`, `createdAt` envelope fields)

---

## SSE Format

All streaming routes (`/message`, `/finalize`) use `Content-Type: text/event-stream`:

```
data: {"type":"chunk","content":"..."}\n\n
data: {"type":"done"}\n\n
```

Finalize also sends before `done`:
```
data: {"type":"analysisId","value":"..."}\n\n
```

---

## File Structure

### New files added

```
app/
├── page.tsx                          ← REPLACE: home/planning screen
├── analysis/
│   └── [id]/
│       └── page.tsx                  ← NEW: loads real data, renders Dashboard
└── api/
    ├── chat/
    │   └── route.ts                  ← POST: start conversation, GET: list analyses
    ├── chat/[id]/
    │   ├── message/
    │   │   └── route.ts              ← POST: send message, stream Bob reply
    │   └── finalize/
    │       └── route.ts              ← POST: generate plan, stream, analyze, save
    └── analyses/
        └── [id]/
            └── route.ts              ← GET: load saved analysis

lib/
├── planning-analysis.js              ← NEW: copied from bobops project (unchanged)
├── bob-client.ts                     ← NEW: Bob API HTTP + SSE streaming
├── skill-loader.ts                   ← NEW: reads ~/.bob/skills/ SKILL.md files
└── storage.ts                        ← NEW: read/write JSON in data/

components/planner/
├── chat-screen.tsx                   ← NEW: full chat UI (messages + input)
├── message-bubble.tsx                ← NEW: single message bubble with streaming
└── past-analyses-list.tsx            ← NEW: clickable list of past analyses
```

### Unchanged files

All of `components/dashboard/`, `components/ui/`, `styles/`, `public/`, `hooks/`, `lib/utils.ts`, `lib/mock-data.ts` (kept but unused).

### New data directories (gitignored)

```
data/
├── conversations/     ← {id}.json — message history per session
└── analyses/          ← {id}.json — full analyzePlan() result per session
```

---

## Module Responsibilities

### `lib/bob-client.ts`
- `callBobStream(messages, onChunk, signal?)` — POSTs to Bob API with `stream: true`, calls `onChunk(text)` for each SSE chunk, resolves with full text
- Reads credentials from `process.env.BOBSHELL_API_KEY`, `BOB_INSTANCE_ID`, `BOB_TEAM_ID`
- Model: `premium`
- Throws on non-2xx or empty response

### `lib/skill-loader.ts`
- `loadPlanningSkills()` — reads `plan-request`, `brainstorming`, `writing-plans` from `~/.bob/skills/`, strips YAML frontmatter, returns `Record<string, string>`
- Returns empty string for missing skills (non-fatal)

### `lib/storage.ts`
- `saveConversation(id, messages)` / `loadConversation(id)` — `data/conversations/{id}.json`
- `saveAnalysis(id, result)` / `loadAnalysis(id)` — `data/analyses/{id}.json`
- `listAnalyses()` — reads all `data/analyses/*.json`, returns metadata array sorted by date desc
- Creates `data/` directories if they don't exist

### `lib/planning-analysis.js`
- Unchanged copy from bobops project
- Called as: `analyzePlan({ source: 'web', transcript: [{ role: 'bob', content: planText, created_at: ISO }] })`

---

## Conversation System Prompt

Every conversation starts with the same system message built from three skills + a tool constraint directive:

```
## IMPORTANT: Environment Constraints
You are running inside a browser-based chat UI. You MUST:
- NOT use any tools, MCP servers, or file system access — none are available
- NOT offer a visual companion or browser features
- Ask clarifying questions — the user is present and will answer in the chat
- When you have enough information, generate the complete implementation and design plan

---
{plan-request skill content}

---
{brainstorming skill content}

---
{writing-plans skill content}
```

---

## Credentials

`.env.local` in the project root (already gitignored by Next.js):

```
BOBSHELL_API_KEY=bob_prod_bob-apikey_<your-key>
BOB_INSTANCE_ID=20260320-1730-1190-51d7-2eb712f71838
BOB_TEAM_ID=019dac3e-6ca3-7ebd-9e7b-b0efaf7f7a0c
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Missing `.env.local` credentials | Home page shows red banner: "Bob API credentials not configured" |
| Bob API error mid-stream | Error message appears as a Bob bubble in chat; input re-enables |
| `data/` write failure | Sonner toast: "Failed to save analysis"; user stays on chat page |
| `/analysis/[id]` unknown ID | "Analysis not found" page with link back to home |
| Skill files missing | Conversation proceeds without that skill's instructions (non-fatal) |

---

## Data Shape

`data/conversations/{id}.json`:
```json
{
  "id": "...",
  "idea": "...",
  "createdAt": "ISO",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

`data/analyses/{id}.json` — full `analyzePlan()` return value (same shape as `AnalysisResult` in `lib/mock-data.ts`, plus `id` and `idea` fields at the top level):
```json
{
  "id": "...",
  "idea": "...",
  "createdAt": "ISO",
  "finalPlan": "...",
  "keywords": [...],
  "costEstimate": { ... },
  "scope": { ... },
  "openQuestions": [...],
  "taskCount": 12,
  "parsedFromDocument": true,
  "report": "..."
}
```

---

## Running Locally

```bash
cd b_qi9a5DeONHl
pnpm install
# add .env.local with credentials
pnpm dev
# open http://localhost:3000
```
