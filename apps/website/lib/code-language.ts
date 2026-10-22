const languages: Record<string, readonly [string, string]> = {
  typescript: ["TypeScript", "TS"],
  javascript: ["JavaScript", "JS"],
  tsx: ["TSX", "TSX"],
  jsx: ["JSX", "JSX"],
  json: ["JSON", "{}"],
  jsonc: ["JSONC", "{}"],
  shell: ["Shell", ">_"],
  html: ["HTML", "<>"],
  css: ["CSS", "#"],
  sql: ["SQL", "SQL"],
  yaml: ["YAML", "YML"],
  markdown: ["Markdown", "MD"],
  python: ["Python", "PY"],
  diff: ["Diff", "+−"],
  dockerfile: ["Dockerfile", "DK"],
  env: ["Environment", "ENV"],
  url: ["URL", "↗"],
  text: ["Text", "TXT"],
  code: ["Code", "</>"],
};
const aliases: Record<string, string> = {
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  console: "shell",
  shellscript: "shell",
  yml: "yaml",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  plaintext: "text",
  txt: "text",
};

export function describeCode({
  language,
  title,
  source = "",
}: {
  language?: string;
  title?: string;
  source?: string;
}) {
  const filename = title?.trim().split("/").at(-1)?.toLowerCase();
  const extension = filename?.startsWith(".env")
    ? "env"
    : filename === "dockerfile"
      ? "dockerfile"
      : filename?.split(".").slice(1).at(-1);
  const normalize = (value?: string) =>
    value ? (aliases[value.toLowerCase()] ?? value.toLowerCase()) : undefined;
  const fileLanguage = normalize(extension);
  let key =
    fileLanguage && languages[fileLanguage]
      ? fileLanguage
      : normalize(language);
  const code = source.trim();
  // Prefer declared metadata. Only infer recognizable signatures; ambiguous
  // snippets keep a neutral label instead of guessing a filename or language.
  if (!key || key === "text") {
    if (
      /^(?:https?:\/\/\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?\/\S*)$/i.test(
        code
      )
    )
      key = "url";
    else if (
      /^(?:\$\s*)?(?:npx|npm|pnpm|yarn|bun|curl|git|node|deno|uv|pip|docker|vc|vercel)\s/m.test(
        code
      )
    )
      key = "shell";
    else if (
      /^(?:import\s+type\b|export\s+(?:interface|type)\b|interface\s+\w+)|\b(?:const|let)\s+\w+\s*:\s*\w+/m.test(
        code
      )
    )
      key = "typescript";
    else if (
      /^(?:from\s+\w+\s+import|def\s+\w+\(|import\s+\w+\s*$)/m.test(code)
    )
      key = "python";
    else if (
      /^(?:import\s|export\s+(?:default|const|function)|(?:const|let|var|async function|function)\s)/m.test(
        code
      )
    )
      key = "javascript";
    else if (
      /^(?:SELECT\s.+\sFROM|CREATE\s+TABLE|INSERT\s+INTO|ALTER\s+TABLE)\b/im.test(
        code
      )
    )
      key = "sql";
    else if (/^\s*(?:<!doctype html|<html\b)/i.test(code)) key = "html";
    else if (/^[{[]/.test(code)) {
      try {
        JSON.parse(code);
        key = "json";
      } catch {
        /* Leave ambiguous source neutral. */
      }
    }
  }
  const [label, badge] = languages[key ?? "code"] ?? [
    language || "Code",
    "</>",
  ];
  return { label, badge };
}
