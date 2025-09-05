export interface ToolCallResponse {
  toolName: string;
  output: string;
}

export function formatTextWithLineBreaks(text: string): string {
  // Replace \n with actual line breaks and handle multiple consecutive line breaks
  return text
    .replace(/\\n/g, "\n") // Convert literal \n to actual newlines
    .replace(/\n+/g, "\n") // Replace multiple consecutive newlines with single newline
    .trim(); // Remove leading/trailing whitespace
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseResponse(response: any): ToolCallResponse {
  const result = response.toolResults.map((result: any) => ({
    toolName: result.toolName,
    output: formatTextWithLineBreaks(result.output.content[0].text),
  }))[0];

  return result;
}
