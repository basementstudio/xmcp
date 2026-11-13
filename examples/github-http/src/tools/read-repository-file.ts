import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import {
  githubRequest,
  MAX_FILE_BYTES,
  repository,
  toolError,
  toolResult,
} from "../github";

export const schema = {
  ...repository,
  path: z
    .string()
    .min(1)
    .max(1000)
    .refine(
      (value) =>
        !/[\\\x00-\x1f]/.test(value) &&
        value
          .split("/")
          .every((part) => part !== "" && part !== "." && part !== ".."),
      "Use a relative file path without empty, dot, or parent segments"
    ),
  ref: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe(
      "Branch, tag, or commit SHA; defaults to the repository's default branch"
    ),
};
export const metadata: ToolMetadata = {
  name: "read-repository-file",
  description:
    "Read one UTF-8 text file up to 100,000 bytes from GitHub. Directories, submodules, binary data, and larger files return tool errors. Use a commit SHA for reproducible content.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const responseSchema = z.object({
  type: z.literal("file"),
  path: z.string(),
  sha: z.string(),
  size: z.number().nonnegative().max(MAX_FILE_BYTES),
  encoding: z.literal("base64"),
  content: z.string(),
  html_url: z.string().nullable(),
  submodule_git_url: z.string().optional(),
});
export default async function readFile({
  owner,
  repo,
  path,
  ref,
}: InferSchema<typeof schema>) {
  const result = await githubRequest(
    `${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    { ref },
    responseSchema
  );
  if ("error" in result) return result.error;
  const file = result.data;
  if (file.submodule_git_url)
    return toolError("Submodules are not supported; select a UTF-8 text file.");
  const encoded = file.content.replace(/\s/g, "");
  const bytes = Buffer.from(encoded, "base64");
  if (
    bytes.toString("base64") !== encoded ||
    bytes.length !== file.size ||
    bytes.length > MAX_FILE_BYTES ||
    bytes.includes(0)
  )
    return toolError("The file is binary, too large, or has invalid content.");
  try {
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return toolResult({
      path: file.path,
      sha: file.sha,
      url: file.html_url,
      content,
    });
  } catch {
    return toolError("The file is not valid UTF-8 text.");
  }
}
