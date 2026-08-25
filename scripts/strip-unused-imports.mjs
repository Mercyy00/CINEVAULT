/**
 * One-shot cleanup: removes unused *import specifiers* reported by tsc as
 * TS6133. Import statements only -- anything else is listed for manual review.
 *
 * Not part of the build. Run with `node scripts/strip-unused-imports.mjs`,
 * then re-run `npx tsc --noEmit` to confirm.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

function runTsc() {
  try {
    return execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    return (error.stdout || '') + (error.stderr || '');
  }
}

const LINE_RE = /^(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read\.$/;

const byFile = new Map();
for (const line of runTsc().split(/\r?\n/)) {
  const match = LINE_RE.exec(line.trim());
  if (!match) continue;
  const [, file, lineNo, col, name] = match;
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ line: Number(lineNo), col: Number(col), name });
}

/** True when `index` sits inside an import statement. */
function insideImport(lines, index) {
  if (/^\s*import\s/.test(lines[index])) return true;
  for (let i = index; i >= 0 && index - i < 40; i -= 1) {
    if (/^\s*import\s/.test(lines[i])) return true;
    if (/^\s*(export|const|let|var|function|class|interface|type|return)\b/.test(lines[i])) break;
  }
  return false;
}

function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

let removed = 0;
const manual = [];

for (const [file, hits] of byFile) {
  const lines = readFileSync(file, 'utf8').split('\n');
  hits.sort((a, b) => b.line - a.line || b.col - a.col);

  for (const hit of hits) {
    const index = hit.line - 1;
    const original = lines[index];
    if (original === undefined) continue;

    if (!insideImport(lines, index)) {
      manual.push(`${file}:${hit.line}  ${hit.name}`);
      continue;
    }

    const name = escapeRe(hit.name);
    const candidates = [
      // `Name, ` in a named list or after a default import
      new RegExp(String.raw`\b(?:type\s+)?` + name + String.raw`\s*,\s*`),
      // `, Name` as the last entry
      new RegExp(String.raw`\s*,\s*(?:type\s+)?` + name + String.raw`\b`),
      // bare `Name`
      new RegExp(String.raw`\b(?:type\s+)?` + name + String.raw`\b`),
    ];

    let updated = original;
    for (const pattern of candidates) {
      if (pattern.test(original)) {
        updated = original.replace(pattern, '');
        break;
      }
    }

    if (updated === original) {
      manual.push(`${file}:${hit.line}  ${hit.name}  (pattern did not match)`);
      continue;
    }

    lines[index] = updated;
    removed += 1;
  }

  let text = lines.join('\n');
  // Tidy the shapes the removals can leave behind.
  text = text
    // `import , { X } from` -> `import { X } from`
    .replace(/import\s+,\s*\{/g, 'import {')
    // `import { } from '...';` -> drop the statement
    .replace(/^[ \t]*import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?[ \t]*\r?\n/gm, '')
    // `import  from '...';` (default removed, nothing left) -> drop
    .replace(/^[ \t]*import\s+from\s*['"][^'"]+['"];?[ \t]*\r?\n/gm, '')
    // trailing comma before the closing brace
    .replace(/,(\s*)\}\s*from/g, '$1} from')
    // `{ , X }` leftovers
    .replace(/\{\s*,\s*/g, '{ ');

  writeFileSync(file, text);
}

console.log(`Removed ${removed} unused import specifiers.`);
if (manual.length) {
  console.log(`\nNeeds manual attention (${manual.length}):`);
  for (const entry of manual) console.log('  ' + entry);
}
