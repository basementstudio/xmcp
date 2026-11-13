/**
 * A Nano used-block store that survives a restart.
 *
 * Every claimed block hash is appended to a file as one line and flushed to
 * disk before the claim counts, so a block that paid for a call is still
 * refused after the server restarts. Only `node:fs` is used.
 */
import {
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  renameSync,
  writeSync,
} from "node:fs";
import type { NanoPaymentStore } from "./nano.js";

const BLOCK_HASH_LINE = /^[0-9A-F]{64}$/;

function writeDurably(path: string, text: string, flags: "a" | "w"): void {
  const fd = openSync(path, flags, 0o600);
  try {
    if (text.length > 0) writeSync(fd, text);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function rewrite(path: string, hashes: Iterable<string>): void {
  let text = "";
  for (const hash of hashes) text += `${hash}\n`;
  const temporary = `${path}.tmp`;
  writeDurably(temporary, text, "w");
  renameSync(temporary, path);
}

/**
 * Open (or create) a claims file at `path`.
 *
 * A line cut short by a crash during an append is dropped when the file is
 * opened again: its claim never completed, so the call it was for was not
 * served. Any other line that is not a block hash is an error, so a damaged
 * file stops the server instead of silently forgetting claims.
 */
export function createNanoFileStore(path: string): NanoPaymentStore {
  const claimed = new Set<string>();

  if (existsSync(path)) {
    const text = readFileSync(path, "utf8");
    const lines = text.split("\n");
    const unterminated = lines.pop() ?? "";

    lines.forEach((line, index) => {
      if (!BLOCK_HASH_LINE.test(line)) {
        throw new Error(
          `Nano claims file ${path}: line ${index + 1} is not a block hash`
        );
      }
      claimed.add(line);
    });

    if (unterminated.length > 0) rewrite(path, claimed);
  } else {
    writeDurably(path, "", "a");
  }

  return {
    has(blockHash) {
      return claimed.has(blockHash);
    },
    add(blockHash) {
      if (!BLOCK_HASH_LINE.test(blockHash)) {
        throw new Error("Nano claims file: not an upper-case block hash");
      }
      if (claimed.has(blockHash)) return;
      claimed.add(blockHash);
      try {
        writeDurably(path, `${blockHash}\n`, "a");
      } catch (error) {
        claimed.delete(blockHash);
        throw error;
      }
    },
    delete(blockHash) {
      if (!claimed.delete(blockHash)) return;
      try {
        rewrite(path, claimed);
      } catch (error) {
        // The claim is still on disk, so keep refusing the block
        claimed.add(blockHash);
        throw error;
      }
    },
  };
}
