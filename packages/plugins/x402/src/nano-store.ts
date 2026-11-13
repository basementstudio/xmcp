/**
 * A Nano used-block store that survives a restart.
 *
 * The claims file is an append-only log. A claimed block hash is appended as
 * one line (`<hash>`) and a released claim as a tombstone line (`-<hash>`),
 * each flushed to disk before the claim or release counts, so a block that
 * paid for a call is still refused after the server restarts, and a block
 * whose call failed can be claimed again. Releasing a claim costs one append,
 * not a rewrite of the file. The log is compacted to the live claims when it
 * is opened, and while running once released lines outnumber live ones, so
 * the file stays proportional to the claims it holds. Only `node:fs` is used.
 */
import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  ftruncateSync,
  openSync,
  readFileSync,
  renameSync,
  writeSync,
} from "node:fs";
import type { NanoPaymentStore } from "./nano.js";

const BLOCK_HASH = /^[0-9A-F]{64}$/;
const RELEASE_PREFIX = "-";

/**
 * Released lines (a claim line plus its tombstone) tolerated before the log
 * is compacted while running. Compaction also waits until released lines
 * outnumber live claims, so its cost is amortized over the releases.
 */
const COMPACT_AFTER_RELEASED_LINES = 4096;

/** Write all of `bytes` to `fd`, looping over short writes. */
function writeAll(fd: number, bytes: Buffer): void {
  let offset = 0;
  while (offset < bytes.length) {
    const written = writeSync(fd, bytes, offset, bytes.length - offset);
    if (written <= 0) {
      throw new Error("Nano claims file: write made no progress");
    }
    offset += written;
  }
}

/**
 * Append `text` to the file and flush it. If the write or flush fails, the
 * file is cut back to its previous length so no partial line is left in
 * front of the next append. When that cut also fails, the error carries
 * `nanoClaimsTorn: true`.
 */
function appendDurably(path: string, text: string): void {
  const fd = openSync(path, "a", 0o600);
  try {
    const before = fstatSync(fd).size;
    try {
      writeAll(fd, Buffer.from(text, "utf8"));
      fsyncSync(fd);
    } catch (error) {
      let torn = false;
      try {
        ftruncateSync(fd, before);
        fsyncSync(fd);
      } catch {
        torn = true;
      }
      throw Object.assign(
        error instanceof Error ? error : new Error(String(error)),
        { nanoClaimsTorn: torn }
      );
    }
  } finally {
    closeSync(fd);
  }
}

/** Replace the file with one line per live claim, atomically. */
function compact(path: string, hashes: Iterable<string>): void {
  let text = "";
  for (const hash of hashes) text += `${hash}\n`;
  const temporary = `${path}.tmp`;
  const fd = openSync(temporary, "w", 0o600);
  try {
    writeAll(fd, Buffer.from(text, "utf8"));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temporary, path);
}

/**
 * Open (or create) a claims file at `path`.
 *
 * A line cut short by a crash during an append is dropped when the file is
 * opened again: its claim never completed, so the call it was for was not
 * served, or its release never completed, so the block stays claimed. Any
 * other line that is neither a block hash nor a tombstone is an error, so a
 * damaged file stops the server instead of silently forgetting claims.
 */
export function createNanoFileStore(path: string): NanoPaymentStore {
  const claimed = new Set<string>();
  // Lines in the file that no longer stand for a live claim
  let releasedLines = 0;
  // Set when a failed append could not be cut back: later appends would be
  // glued to the partial line, so the store refuses to write any more
  let damaged = false;

  if (existsSync(path)) {
    const text = readFileSync(path, "utf8");
    const lines = text.split("\n");
    const unterminated = lines.pop() ?? "";

    lines.forEach((line, index) => {
      if (BLOCK_HASH.test(line)) {
        claimed.add(line);
        return;
      }
      const released = line.slice(RELEASE_PREFIX.length);
      if (line.startsWith(RELEASE_PREFIX) && BLOCK_HASH.test(released)) {
        claimed.delete(released);
        return;
      }
      throw new Error(
        `Nano claims file ${path}: line ${index + 1} is not a block hash`
      );
    });

    if (unterminated.length > 0 || lines.length > claimed.size) {
      compact(path, claimed);
    }
  } else {
    appendDurably(path, "");
  }

  function append(text: string): void {
    if (damaged) {
      throw new Error(
        `Nano claims file ${path}: an earlier write failed, restart to recover`
      );
    }
    try {
      appendDurably(path, text);
    } catch (error) {
      if ((error as { nanoClaimsTorn?: boolean }).nanoClaimsTorn) {
        damaged = true;
      }
      throw error;
    }
  }

  return {
    has(blockHash) {
      return claimed.has(blockHash);
    },
    add(blockHash) {
      if (!BLOCK_HASH.test(blockHash)) {
        throw new Error("Nano claims file: not an upper-case block hash");
      }
      if (claimed.has(blockHash)) return;
      claimed.add(blockHash);
      try {
        append(`${blockHash}\n`);
      } catch (error) {
        claimed.delete(blockHash);
        throw error;
      }
    },
    delete(blockHash) {
      if (!claimed.has(blockHash)) return;
      // The claim stays until its tombstone is on disk, so a failed release
      // keeps refusing the block
      append(`${RELEASE_PREFIX}${blockHash}\n`);
      claimed.delete(blockHash);
      releasedLines += 2;

      if (
        releasedLines >= COMPACT_AFTER_RELEASED_LINES &&
        releasedLines > claimed.size
      ) {
        // Tried once per window: if it fails the log is still correct and
        // simply stays longer until the next window
        releasedLines = 0;
        try {
          compact(path, claimed);
        } catch {
          // Ignored on purpose, see above
        }
      }
    },
  };
}
