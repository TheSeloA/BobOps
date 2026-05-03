import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { CostEstimate, Scope } from './planning-analysis';

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
  costEstimate: CostEstimate;
  scope: Scope;
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
