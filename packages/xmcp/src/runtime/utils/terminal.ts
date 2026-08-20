export const greenCheck = "\u001b[1m\u001b[32m✔\u001b[39m\u001b[22m";
export const yellowArrow = "\u001b[1m\u001b[33m❯\u001b[39m\u001b[22m";

export function yellow(value: string): string {
  return `\u001b[33m${value}\u001b[39m`;
}
