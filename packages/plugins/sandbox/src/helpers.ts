/**
 * JavaScript code injected into the sandbox VM alongside agent code.
 * Provides search(query), filter(opts), and endpoints global.
 * This string is prepended to the agent's script inside the sandbox.
 */
export const SEARCH_HELPERS = `
// Parse the spec into a searchable endpoints array
const __spec = JSON.parse(spec);
const endpoints = [];
for (const [path, methods] of Object.entries(__spec.paths || {})) {
  for (const [method, op] of Object.entries(methods)) {
    if (method === 'parameters' || method === 'summary' || method === 'description') continue;
    endpoints.push({
      path,
      method: method.toUpperCase(),
      summary: op.summary || '',
      description: op.description || '',
      tags: op.tags || [],
      parameters: op.parameters || [],
      operationId: op.operationId || '',
    });
  }
}

// Fuzzy text search: matches query against path, summary, description, tags, operationId
function search(query) {
  if (!query) return endpoints;
  const q = query.toLowerCase();
  const terms = q.split(/\\s+/);

  return endpoints
    .map(ep => {
      const text = [ep.path, ep.method, ep.summary, ep.description, ep.operationId, ...ep.tags]
        .join(' ')
        .toLowerCase();

      // Score: count how many terms match + fuzzy bonus for partial matches
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) {
          score += 1;
        } else {
          // Fuzzy: check if any word in text is close to the term (Levenshtein-like)
          const words = text.split(/[\\s\\/\\-_]+/);
          for (const word of words) {
            if (word.length > 1 && term.length > 1) {
              const maxLen = Math.max(word.length, term.length);
              let dist = 0;
              for (let i = 0; i < maxLen; i++) {
                if (word[i] !== term[i]) dist++;
              }
              if (dist / maxLen < 0.4) {
                score += 0.5;
                break;
              }
            }
          }
        }
      }
      return { ...ep, _score: score };
    })
    .filter(ep => ep._score > 0)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...ep }) => ep);
}

// Structured filter: match by method, tag, or path pattern
function filter(opts = {}) {
  let results = endpoints;
  if (opts.method) {
    const m = opts.method.toUpperCase();
    results = results.filter(ep => ep.method === m);
  }
  if (opts.tag) {
    const t = opts.tag.toLowerCase();
    results = results.filter(ep => ep.tags.some(tag => tag.toLowerCase() === t));
  }
  if (opts.path) {
    const p = opts.path.toLowerCase();
    results = results.filter(ep => ep.path.toLowerCase().includes(p));
  }
  return results;
}
`;
