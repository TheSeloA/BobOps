const BUDGET = 8000;
const PRIORITY_FILES = ['README.md', 'package.json'];

async function tryFetch(url: string, raw = false): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: raw
        ? { Accept: 'application/vnd.github.v3.raw' }
        : { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export async function fetchGitHubRepoContext(repoUrl: string): Promise<string | null> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const base = `https://api.github.com/repos/${owner}/${repo}/contents`;
  const sections: string[] = [];
  let budget = BUDGET;

  for (const file of PRIORITY_FILES) {
    if (budget <= 0) break;
    const content = await tryFetch(`${base}/${file}`, true);
    if (!content) continue;
    const snippet = content.slice(0, Math.min(budget, 1500));
    sections.push(`### ${file}\n\`\`\`\n${snippet}\n\`\`\``);
    budget -= snippet.length;
  }

  if (budget > 0) {
    for (const dir of ['src', '']) {
      if (budget <= 0) break;
      const listUrl = dir ? `${base}/${dir}` : base;
      const listRaw = await tryFetch(listUrl);
      if (!listRaw) continue;
      try {
        const entries: { name: string; type: string; download_url: string }[] = JSON.parse(listRaw);
        const sourceFiles = entries
          .filter(e => e.type === 'file' && /\.(ts|tsx|js|jsx|py)$/.test(e.name))
          .slice(0, 3);
        for (const f of sourceFiles) {
          if (budget <= 0) break;
          const content = await tryFetch(f.download_url, true);
          if (!content) continue;
          const snippet = content.slice(0, Math.min(budget, 800));
          const label = dir ? `${dir}/${f.name}` : f.name;
          sections.push(`### ${label}\n\`\`\`\n${snippet}\n\`\`\``);
          budget -= snippet.length;
        }
      } catch { continue; }
    }
  }

  if (sections.length === 0) return null;
  return `## Existing Codebase Context (${owner}/${repo})\n\n${sections.join('\n\n')}`;
}
