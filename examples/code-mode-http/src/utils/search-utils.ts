import type { ToolInfo } from "xmcp";

export interface ScoredResult {
  tool: ToolInfo;
  score: number;
}

export interface SearchIndex {
  tools: ToolInfo[];
  idf: Map<string, number>;
  toolTerms: Map<string, Map<string, number>>;
}

/** Tokenize text into lowercase terms */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Build a TF-IDF index from tool names and descriptions */
export function buildIndex(tools: ToolInfo[]): SearchIndex {
  const docCount = tools.length;
  const docFreq = new Map<string, number>();
  const toolTerms = new Map<string, Map<string, number>>();

  for (const tool of tools) {
    const text = `${tool.name} ${tool.description} ${(tool.annotations as any)?.tags?.join(" ") ?? ""}`;
    const terms = tokenize(text);
    const tf = new Map<string, number>();
    for (const term of terms) {
      tf.set(term, (tf.get(term) ?? 0) + 1);
    }
    // Normalize TF
    const maxFreq = Math.max(...tf.values(), 1);
    const normalized = new Map<string, number>();
    for (const [term, freq] of tf) {
      normalized.set(term, freq / maxFreq);
    }
    toolTerms.set(tool.name, normalized);

    const seen = new Set<string>();
    for (const term of terms) {
      if (!seen.has(term)) {
        docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
        seen.add(term);
      }
    }
  }

  const idf = new Map<string, number>();
  for (const [term, freq] of docFreq) {
    idf.set(term, Math.log((docCount + 1) / (freq + 1)) + 1);
  }

  return { tools, idf, toolTerms };
}

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Best fuzzy match score (0-1) of a query term against a tool's terms */
function fuzzyScore(queryTerm: string, toolText: string): number {
  const toolTerms = tokenize(toolText);
  let best = 0;
  for (const t of toolTerms) {
    const maxLen = Math.max(queryTerm.length, t.length);
    if (maxLen === 0) continue;
    const dist = levenshtein(queryTerm, t);
    const sim = 1 - dist / maxLen;
    if (sim > best) best = sim;
  }
  return best;
}

/** Search tools by query, returning scored and sorted results */
export function searchTools(
  index: SearchIndex,
  query: string,
  minScore = 0.15
): ScoredResult[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return index.tools.map((t) => ({ tool: t, score: 1 }));

  const results: ScoredResult[] = [];

  for (const tool of index.tools) {
    const toolTf = index.toolTerms.get(tool.name);
    if (!toolTf) continue;

    const toolText = `${tool.name} ${tool.description}`;

    // TF-IDF score
    let tfidfScore = 0;
    for (const qt of queryTerms) {
      const tf = toolTf.get(qt) ?? 0;
      const idf = index.idf.get(qt) ?? 0;
      tfidfScore += tf * idf;
    }
    // Normalize by query length
    tfidfScore = tfidfScore / queryTerms.length;

    // Fuzzy score (average best match per query term)
    let fuzzy = 0;
    for (const qt of queryTerms) {
      fuzzy += fuzzyScore(qt, toolText);
    }
    fuzzy = fuzzy / queryTerms.length;

    // Combined: weight TF-IDF higher, fuzzy as fallback
    const score = tfidfScore * 0.6 + fuzzy * 0.4;

    if (score >= minScore) {
      results.push({ tool, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
