// Pure derived-selector logic — given text and the current search words, returns
// segments for rendering as JSX <mark> fragments instead of dangerouslySetInnerHTML,
// which also removes the need to replicate escapeHtml for this path (React's
// default text escaping makes that precaution unnecessary here).
export type Segment = { text: string; matched: boolean };

export function splitSearchWords(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesAllWords(text: string, words: string[]): boolean {
  if (words.length === 0) return true;
  const lower = text.toLowerCase();
  return words.every((w) => lower.includes(w));
}

export function highlightSegments(text: string, words: string[]): Segment[] {
  if (words.length === 0) return [{ text, matched: false }];
  const pattern = words
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(`(${pattern})`, "ig");
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > lastIndex) segments.push({ text: text.slice(lastIndex, m.index), matched: false });
    segments.push({ text: m[0], matched: true });
    lastIndex = m.index! + m[0].length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), matched: false });
  return segments;
}
