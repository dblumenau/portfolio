/** Fixture-only baseline ORP adapter. No corpus vocabulary or wordlist request. */
function spritzPos(n: number): number {
  if (n <= 1) return 1;
  if (n <= 5) return 2;
  if (n <= 9) return 3;
  if (n <= 13) return 4;
  if (n <= 17) return 5;
  return 6;
}
export function renderOrp(word: string): { before: string; orp: string; after: string } {
  const m = word.match(/^(.*?)([.,;:!?…]*)$/);
  const stem = m ? m[1] : word;
  const trail = m ? m[2] : "";
  if (!stem) return { before: "", orp: "", after: word };
  const pos = spritzPos(stem.length);
  return {before: stem.slice(0, pos - 1),orp: stem.slice(pos - 1, pos),after: stem.slice(pos) + trail};
}
