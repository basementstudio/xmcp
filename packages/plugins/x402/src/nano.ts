/**
 * Local verification of Nano (XNO) payments.
 *
 * Nano has no facilitator: the payer publishes a send block to the configured
 * wallet and passes its hash as the payment payload. The server reads the
 * block from a Nano node RPC and checks that it is a confirmed send of at
 * least the required amount to the configured account. No private key is
 * held and nothing is broadcast.
 */

export type NanoRpc = (body: Record<string, string>) => Promise<unknown>;

export interface NanoPaymentStore {
  has(blockHash: string): boolean;
  add(blockHash: string): void;
  delete(blockHash: string): void;
}

export interface VerifyNanoPaymentOptions {
  blockHash: unknown;
  payTo: string;
  /** Required amount in raw (1 XNO = 10^30 raw) */
  amount: string;
  rpc: NanoRpc;
  usedBlocks: NanoPaymentStore;
  /** Reject blocks the node first saw longer ago than this, when it reports a timestamp */
  maxPaymentAgeSeconds?: number;
}

export type NanoVerification =
  | { valid: true; blockHash: string; payer: string; amount: string }
  | { valid: false; error: string };

const ADDRESS_ALPHABET = "13456789abcdefghijkmnopqrstuwxyz";
const ADDRESS_PATTERN =
  /^(?:nano|xrb)_([13][13456789abcdefghijkmnopqrstuwxyz]{51})([13456789abcdefghijkmnopqrstuwxyz]{8})$/;
const BLOCK_HASH_PATTERN = /^[0-9A-Fa-f]{64}$/;

// --- BLAKE2b (RFC 7693), only used for the 5-byte address checksum ---

const MASK_64 = (1n << 64n) - 1n;
const BLAKE2B_IV = [
  0x6a09e667f3bcc908n,
  0xbb67ae8584caa73bn,
  0x3c6ef372fe94f82bn,
  0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n,
  0x9b05688c2b3e6c1fn,
  0x1f83d9abfb41bd6bn,
  0x5be0cd19137e2179n,
];
const BLAKE2B_SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

function rotr64(value: bigint, bits: bigint): bigint {
  return ((value >> bits) | (value << (64n - bits))) & MASK_64;
}

function blake2bCompress(
  h: bigint[],
  block: Uint8Array,
  bytesSoFar: bigint,
  last: boolean
): void {
  const m: bigint[] = [];
  for (let i = 0; i < 16; i++) {
    let word = 0n;
    for (let j = 7; j >= 0; j--) {
      word = (word << 8n) | BigInt(block[i * 8 + j]);
    }
    m.push(word);
  }

  const v = [...h, ...BLAKE2B_IV];
  v[12] ^= bytesSoFar & MASK_64;
  v[13] ^= bytesSoFar >> 64n;
  if (last) v[14] ^= MASK_64;

  const mix = (
    a: number,
    b: number,
    c: number,
    d: number,
    x: bigint,
    y: bigint
  ) => {
    v[a] = (v[a] + v[b] + x) & MASK_64;
    v[d] = rotr64(v[d] ^ v[a], 32n);
    v[c] = (v[c] + v[d]) & MASK_64;
    v[b] = rotr64(v[b] ^ v[c], 24n);
    v[a] = (v[a] + v[b] + y) & MASK_64;
    v[d] = rotr64(v[d] ^ v[a], 16n);
    v[c] = (v[c] + v[d]) & MASK_64;
    v[b] = rotr64(v[b] ^ v[c], 63n);
  };

  for (let round = 0; round < 12; round++) {
    const s = BLAKE2B_SIGMA[round % 10];
    mix(0, 4, 8, 12, m[s[0]], m[s[1]]);
    mix(1, 5, 9, 13, m[s[2]], m[s[3]]);
    mix(2, 6, 10, 14, m[s[4]], m[s[5]]);
    mix(3, 7, 11, 15, m[s[6]], m[s[7]]);
    mix(0, 5, 10, 15, m[s[8]], m[s[9]]);
    mix(1, 6, 11, 12, m[s[10]], m[s[11]]);
    mix(2, 7, 8, 13, m[s[12]], m[s[13]]);
    mix(3, 4, 9, 14, m[s[14]], m[s[15]]);
  }

  for (let i = 0; i < 8; i++) {
    h[i] ^= v[i] ^ v[i + 8];
  }
}

/** Unkeyed BLAKE2b with an output length of 1 to 64 bytes */
export function blake2b(input: Uint8Array, outputLength: number): Uint8Array {
  if (outputLength < 1 || outputLength > 64) {
    throw new Error("BLAKE2b output length must be between 1 and 64 bytes");
  }

  const h = [...BLAKE2B_IV];
  h[0] ^= 0x01010000n ^ BigInt(outputLength);

  const blockCount = Math.max(1, Math.ceil(input.length / 128));
  for (let i = 0; i < blockCount; i++) {
    const block = new Uint8Array(128);
    block.set(input.subarray(i * 128, (i + 1) * 128));
    const last = i === blockCount - 1;
    const bytesSoFar = BigInt(last ? input.length : (i + 1) * 128);
    blake2bCompress(h, block, bytesSoFar, last);
  }

  const out = new Uint8Array(64);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      out[i * 8 + j] = Number((h[i] >> BigInt(8 * j)) & 0xffn);
    }
  }
  return out.slice(0, outputLength);
}

// --- Nano addresses ---

function decodeBase32(chars: string): bigint {
  let value = 0n;
  for (const char of chars) {
    value = (value << 5n) | BigInt(ADDRESS_ALPHABET.indexOf(char));
  }
  return value;
}

function encodeBase32(value: bigint, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out = ADDRESS_ALPHABET[Number(value & 31n)] + out;
    value >>= 5n;
  }
  return out;
}

function bigintToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function addressChecksum(publicKey: Uint8Array): Uint8Array {
  return blake2b(publicKey, 5).reverse();
}

/**
 * Decode a `nano_` or `xrb_` address to its 32-byte public key (hex).
 * Returns `undefined` when the format or the checksum is invalid.
 */
export function nanoAddressToPublicKey(address: string): string | undefined {
  if (typeof address !== "string") return undefined;
  const match = ADDRESS_PATTERN.exec(address);
  if (!match) return undefined;

  const publicKey = bigintToBytes(decodeBase32(match[1]), 32);
  const checksum = bigintToBytes(decodeBase32(match[2]), 5);
  const expected = addressChecksum(publicKey);

  for (let i = 0; i < 5; i++) {
    if (checksum[i] !== expected[i]) return undefined;
  }
  return bytesToHex(publicKey);
}

export function isValidNanoAddress(address: string): boolean {
  return nanoAddressToPublicKey(address) !== undefined;
}

/** Encode a 32-byte public key (hex) as a `nano_` address */
export function publicKeyToNanoAddress(publicKeyHex: string): string {
  if (!BLOCK_HASH_PATTERN.test(publicKeyHex)) {
    throw new Error("Public key must be 64 hex characters");
  }
  const key = BigInt(`0x${publicKeyHex}`);
  const checksum = addressChecksum(bigintToBytes(key, 32));
  let checksumValue = 0n;
  for (const byte of checksum)
    checksumValue = (checksumValue << 8n) | BigInt(byte);
  return `nano_${encodeBase32(key, 52)}${encodeBase32(checksumValue, 8)}`;
}

// --- RPC ---

export function createNanoRpc(url: string): NanoRpc {
  return async (body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Nano RPC responded with HTTP ${response.status}`);
    }
    return response.json();
  };
}

interface BlockInfo {
  block_account?: string;
  balance?: string;
  confirmed?: string | boolean;
  subtype?: string;
  local_timestamp?: string;
  contents?: {
    type?: string;
    previous?: string;
    balance?: string;
    link_as_account?: string;
  };
}

async function getBlockInfo(rpc: NanoRpc, hash: string): Promise<BlockInfo> {
  const result = (await rpc({
    action: "block_info",
    json_block: "true",
    hash,
  })) as (BlockInfo & { error?: string }) | null;

  if (!result || typeof result !== "object") {
    throw new Error("Nano RPC returned an invalid response");
  }
  if (result.error) {
    throw new Error(`Nano RPC error: ${result.error}`);
  }
  return result;
}

function parseRaw(value: unknown): bigint | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  return BigInt(value);
}

/**
 * Verify that `blockHash` is a confirmed send block paying at least `amount`
 * raw to `payTo`, and that it has not been used before. On success the hash is
 * recorded in `usedBlocks`.
 */
export async function verifyNanoPayment(
  options: VerifyNanoPaymentOptions
): Promise<NanoVerification> {
  const { blockHash, payTo, rpc, usedBlocks } = options;

  if (typeof blockHash !== "string" || !BLOCK_HASH_PATTERN.test(blockHash)) {
    return { valid: false, error: "Invalid Nano block hash" };
  }
  const hash = blockHash.toUpperCase();

  const payToKey = nanoAddressToPublicKey(payTo);
  if (!payToKey) {
    return { valid: false, error: "Invalid Nano wallet address" };
  }

  const required = parseRaw(options.amount);
  if (required === undefined) {
    return { valid: false, error: "Invalid required amount" };
  }

  if (usedBlocks.has(hash)) {
    return { valid: false, error: "Nano block has already been used" };
  }

  let block: BlockInfo;
  let previous: BlockInfo;
  try {
    block = await getBlockInfo(rpc, hash);

    if (block.confirmed !== "true" && block.confirmed !== true) {
      return { valid: false, error: "Nano block is not confirmed" };
    }
    if (block.contents?.type !== "state" || block.subtype !== "send") {
      return { valid: false, error: "Nano block is not a send block" };
    }

    const destination = block.contents.link_as_account;
    if (!destination || nanoAddressToPublicKey(destination) !== payToKey) {
      return { valid: false, error: "Nano block pays a different account" };
    }

    const previousHash = block.contents.previous;
    if (!previousHash || !BLOCK_HASH_PATTERN.test(previousHash)) {
      return { valid: false, error: "Nano block has no previous block" };
    }
    previous = await getBlockInfo(rpc, previousHash);
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Nano RPC request failed",
    };
  }

  const balance = parseRaw(block.contents?.balance ?? block.balance);
  const previousBalance = parseRaw(
    previous.contents?.balance ?? previous.balance
  );
  if (balance === undefined || previousBalance === undefined) {
    return { valid: false, error: "Nano RPC returned an invalid balance" };
  }

  const paid = previousBalance - balance;
  if (paid < required) {
    return {
      valid: false,
      error: `Nano payment too small: ${paid} raw sent, ${required} raw required`,
    };
  }

  const timestamp = Number(block.local_timestamp);
  if (
    options.maxPaymentAgeSeconds !== undefined &&
    Number.isFinite(timestamp) &&
    timestamp > 0 &&
    Date.now() / 1000 - timestamp > options.maxPaymentAgeSeconds
  ) {
    return { valid: false, error: "Nano payment is older than maxPaymentAge" };
  }

  // Checked again after the RPC round trips so concurrent requests cannot both claim the block
  if (usedBlocks.has(hash)) {
    return { valid: false, error: "Nano block has already been used" };
  }
  usedBlocks.add(hash);

  return {
    valid: true,
    blockHash: hash,
    payer: block.block_account ?? "",
    amount: paid.toString(),
  };
}
