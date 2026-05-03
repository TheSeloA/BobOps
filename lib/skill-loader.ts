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
