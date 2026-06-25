// Rough token estimate (~4 chars/token); good enough for the x-markdown-tokens
// hint that lets agents gauge context-window cost before fetching.
const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
