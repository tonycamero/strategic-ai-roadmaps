import fs from 'fs/promises';
import path from 'path';

/**
 * Read markdown file from disk
 */
export async function readMarkdown(filePath: string): Promise<string> {
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  return fs.readFile(absPath, 'utf8');
}

/**
 * Extract the "## Agent Cheatsheet" section from a markdown string.
 * Returns null if not found.
 */
export function extractAgentCheatsheet(markdown: string): string | null {
  const startRegex = /^## Agent Cheatsheet\s*$/m;
  const match = markdown.match(startRegex);
  if (!match) return null;

  const startIndex = match.index ?? 0;

  // Slice from start of cheatsheet to either next H2 or end of file
  const rest = markdown.slice(startIndex);
  const nextH2 = rest.slice('## Agent Cheatsheet'.length).match(/^##\s+/m);

  if (nextH2 && nextH2.index !== undefined) {
    return rest.slice(0, nextH2.index + '## Agent Cheatsheet'.length).trim();
  }

  return rest.trim();
}
