/**
 * Local verification of Nano (XNO) payments.
 *
 * Nano has no facilitator: the payer publishes a send block to the configured
 * wallet and passes its hash as the payment payload, or passes the signed
 * block itself and the server publishes it through the node. The server reads
 * the block from a Nano node RPC and checks that it is a confirmed send of at
 * least the required amount to the configured account. No private key is
 * held; the only thing ever broadcast is a block the payer signed.
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
  /**
   * When set, the block must carry the xno-binding v1 commitment to this
   * order as its representative, and must send exactly `amount` raw.
   */
  orderId?: string;
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

// --- Binding a payment to one order (xno-binding v1, representative commitment) ---

/** Value of `extra.binding` on a 402 offer that requires an order commitment */
export const NANO_BINDING_V1 = "xno-binding/v1/rep";

const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{22,128}$/;

/** An order id is opaque, URL-safe and long enough to carry 128 random bits */
export function isValidNanoOrderId(orderId: unknown): orderId is string {
  return typeof orderId === "string" && ORDER_ID_PATTERN.test(orderId);
}

/** A fresh random order id (128 bits, hex) */
export function newNanoOrderId(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes).toLowerCase();
}

/**
 * The account a payer sets as the representative of its send block to bind
 * the payment to one order:
 * SHA-256("xno-binding/v1/rep|" + orderId + "|" + payTo + "|" + amountRaw),
 * encoded as a `nano_` address. The payer signs it, so a block hash seen on
 * the public ledger cannot be claimed for another order or by someone who
 * does not hold the order id.
 */
export async function nanoOrderCommitment(
  orderId: string,
  payTo: string,
  amountRaw: string
): Promise<string> {
  const message = new TextEncoder().encode(
    `${NANO_BINDING_V1}|${orderId}|${payTo}|${amountRaw}`
  );
  const digest = await globalThis.crypto.subtle.digest("SHA-256", message);
  return publicKeyToNanoAddress(bytesToHex(new Uint8Array(digest)));
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
    account?: string;
    previous?: string;
    balance?: string;
    link_as_account?: string;
    representative?: string;
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

// --- Signed send blocks (the `payload.block` form of the x402 Nano exact scheme) ---

/** A signed state block in the JSON form a Nano node returns and accepts */
export interface NanoStateBlock {
  type: "state";
  account: string;
  previous: string;
  representative: string;
  balance: string;
  link: string;
  link_as_account?: string;
  signature: string;
  work: string;
}

const SIGNATURE_PATTERN = /^[0-9A-Fa-f]{128}$/;
const WORK_PATTERN = /^[0-9A-Fa-f]{16}$/;
const MAX_RAW = (1n << 128n) - 1n;
const ZERO_HASH = "0".repeat(64);

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Check the shape of a signed state block. Returns the block with its fields
 * typed, or `undefined` when a field is missing or malformed. The signature and
 * the work are checked by the node when the block is published.
 */
export function parseNanoStateBlock(
  value: unknown
): NanoStateBlock | undefined {
  if (!value || typeof value !== "object") return undefined;
  const block = value as Record<string, unknown>;
  const isString = (key: string) => typeof block[key] === "string";
  if (
    block.type !== "state" ||
    ![
      "account",
      "previous",
      "representative",
      "balance",
      "link",
      "signature",
      "work",
    ].every(isString)
  ) {
    return undefined;
  }
  const balance = parseRaw(block.balance);
  if (
    !isValidNanoAddress(block.account as string) ||
    !isValidNanoAddress(block.representative as string) ||
    !BLOCK_HASH_PATTERN.test(block.previous as string) ||
    !BLOCK_HASH_PATTERN.test(block.link as string) ||
    !SIGNATURE_PATTERN.test(block.signature as string) ||
    !WORK_PATTERN.test(block.work as string) ||
    balance === undefined ||
    balance > MAX_RAW
  ) {
    return undefined;
  }
  if (
    block.link_as_account !== undefined &&
    (typeof block.link_as_account !== "string" ||
      nanoAddressToPublicKey(block.link_as_account) !==
        (block.link as string).toUpperCase())
  ) {
    return undefined;
  }
  // Only the block's own fields are kept, so nothing else reaches the node
  const parsed: NanoStateBlock = {
    type: "state",
    account: block.account as string,
    previous: block.previous as string,
    representative: block.representative as string,
    balance: block.balance as string,
    link: block.link as string,
    signature: block.signature as string,
    work: block.work as string,
  };
  if (block.link_as_account !== undefined) {
    parsed.link_as_account = block.link_as_account as string;
  }
  return parsed;
}

/**
 * The hash of a state block: BLAKE2b-256 over the preamble (31 zero bytes and
 * 6), account, previous, representative, balance (16 bytes, big endian) and
 * link. It is the hash the node returns when the block is published.
 */
export function hashNanoStateBlock(block: NanoStateBlock): string {
  const parts = [
    bigintToBytes(6n, 32),
    hexToBytes(nanoAddressToPublicKey(block.account) ?? ""),
    hexToBytes(block.previous),
    hexToBytes(nanoAddressToPublicKey(block.representative) ?? ""),
    bigintToBytes(BigInt(block.balance), 16),
    hexToBytes(block.link),
  ];
  const lengths = [32, 32, 32, 32, 16, 32];
  const message = new Uint8Array(176);
  let offset = 0;
  parts.forEach((part, i) => {
    if (part.length !== lengths[i]) {
      throw new Error("Malformed Nano state block");
    }
    message.set(part, offset);
    offset += part.length;
  });
  return bytesToHex(blake2b(message, 32));
}

export interface PublishNanoPaymentOptions extends Omit<
  VerifyNanoPaymentOptions,
  "blockHash"
> {
  /** The payer's signed, not yet published, send block */
  block: unknown;
  /** How many times to read the block back while it is not yet confirmed */
  confirmAttempts?: number;
  /** Pause between those reads */
  wait?: () => Promise<void>;
}

const NOT_YET_CONFIRMED = new Set([
  "Nano block is not confirmed",
  "Nano RPC error: Block not found",
]);

/**
 * After `process`, the block is read back until the node confirms it. Nano
 * blocks usually confirm in well under a second, so 20 reads 500 ms apart
 * (about 10 seconds) cover a slow network without holding the request open
 * much longer than a client would wait for a tool call.
 */
export const NANO_CONFIRM_ATTEMPTS = 20;
export const NANO_CONFIRM_INTERVAL_MS = 500;

/**
 * The error returned when a block is on the ledger but the node has not
 * confirmed it in time. The payer's funds have left their account and the
 * block may still confirm, so the error names the hash: a client should retry
 * with that `blockHash` instead of signing a new block and paying again.
 */
export function nanoBlockNotConfirmedError(blockHash: string): string {
  return `Nano block ${blockHash} was published but is not confirmed yet; it may still confirm, so retry with payload.blockHash ${blockHash} instead of paying again`;
}

/**
 * Accept a payment sent as a signed send block instead of a block hash, as
 * the x402 Nano exact scheme's clients do. The block is checked before
 * anything is sent to the node: it must be a send of the price to `payTo`
 * (and, with `orderId`, carry the order commitment). It is then published
 * through the node with `process` (the node checks its signature and work),
 * and once confirmed it is verified and claimed exactly like a block hash
 * paid with `verifyNanoPayment`. A block that is already on the ledger is not
 * published again; it is verified by its hash.
 */
export async function publishNanoPayment(
  options: PublishNanoPaymentOptions
): Promise<NanoVerification> {
  const { rpc, usedBlocks } = options;
  const block = parseNanoStateBlock(options.block);
  if (!block) {
    return { valid: false, error: "Invalid Nano send block" };
  }

  const payToKey = nanoAddressToPublicKey(options.payTo);
  if (!payToKey) {
    return { valid: false, error: "Invalid Nano wallet address" };
  }
  const required = parseRaw(options.amount);
  if (required === undefined) {
    return { valid: false, error: "Invalid required amount" };
  }
  if (options.orderId !== undefined && !isValidNanoOrderId(options.orderId)) {
    return { valid: false, error: "Invalid Nano order id" };
  }
  if (block.link.toUpperCase() !== payToKey) {
    return { valid: false, error: "Nano block pays a different account" };
  }
  if (block.previous === ZERO_HASH) {
    return { valid: false, error: "Nano block is not a send block" };
  }
  if (options.orderId !== undefined) {
    const commitment = await nanoOrderCommitment(
      options.orderId,
      options.payTo,
      required.toString()
    );
    if (
      nanoAddressToPublicKey(block.representative) !==
      nanoAddressToPublicKey(commitment)
    ) {
      return { valid: false, error: "Nano block is not bound to this order" };
    }
  }

  const hash = hashNanoStateBlock(block);
  if (usedBlocks.has(hash)) {
    return { valid: false, error: "Nano block has already been used" };
  }

  try {
    const existing = (await rpc({
      action: "block_info",
      json_block: "true",
      hash,
    })) as { error?: string } | null;
    if (!existing || typeof existing !== "object") {
      throw new Error("Nano RPC returned an invalid response");
    }

    if (existing.error === "Block not found") {
      const previous = await getBlockInfo(rpc, block.previous);
      const previousKey = nanoAddressToPublicKey(
        previous.block_account ?? previous.contents?.account ?? ""
      );
      if (previousKey !== nanoAddressToPublicKey(block.account)) {
        return {
          valid: false,
          error: "Nano block does not follow its previous block",
        };
      }
      const previousBalance = parseRaw(
        previous.contents?.balance ?? previous.balance
      );
      if (previousBalance === undefined) {
        return { valid: false, error: "Nano RPC returned an invalid balance" };
      }
      const paid = previousBalance - BigInt(block.balance);
      if (options.orderId !== undefined ? paid !== required : paid < required) {
        return {
          valid: false,
          error: `Nano payment must be ${options.orderId !== undefined ? "exactly" : "at least"} ${required} raw, ${paid} raw sent`,
        };
      }

      const published = (await rpc({
        action: "process",
        subtype: "send",
        block: JSON.stringify(block),
      })) as { hash?: string; error?: string } | null;
      if (!published || typeof published !== "object" || published.error) {
        return {
          valid: false,
          error: `Nano node did not publish the block${published?.error ? `: ${published.error}` : ""}`,
        };
      }
      if (String(published.hash).toUpperCase() !== hash) {
        return { valid: false, error: "Nano node published a different block" };
      }
    } else if (existing.error) {
      throw new Error(`Nano RPC error: ${existing.error}`);
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Nano RPC request failed",
    };
  }

  const attempts = Math.max(
    1,
    options.confirmAttempts ?? NANO_CONFIRM_ATTEMPTS
  );
  const wait =
    options.wait ??
    (() =>
      new Promise<void>((resolve) =>
        setTimeout(resolve, NANO_CONFIRM_INTERVAL_MS)
      ));
  let result: NanoVerification = {
    valid: false,
    error: "Nano block is not confirmed",
  };
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await wait();
    result = await verifyNanoPayment({
      blockHash: hash,
      payTo: options.payTo,
      amount: options.amount,
      rpc,
      usedBlocks,
      maxPaymentAgeSeconds: options.maxPaymentAgeSeconds,
      orderId: options.orderId,
    });
    if (result.valid || !NOT_YET_CONFIRMED.has(result.error)) return result;
  }
  return { valid: false, error: nanoBlockNotConfirmedError(hash) };
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

  if (options.orderId !== undefined && !isValidNanoOrderId(options.orderId)) {
    return { valid: false, error: "Invalid Nano order id" };
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

    if (options.orderId !== undefined) {
      const commitment = await nanoOrderCommitment(
        options.orderId,
        payTo,
        required.toString()
      );
      const representative = block.contents.representative;
      if (
        !representative ||
        nanoAddressToPublicKey(representative) !==
          nanoAddressToPublicKey(commitment)
      ) {
        return { valid: false, error: "Nano block is not bound to this order" };
      }
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
  if (options.orderId !== undefined && paid !== required) {
    return {
      valid: false,
      error: `Nano payment must be exactly ${required} raw, ${paid} raw sent`,
    };
  }
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
  try {
    usedBlocks.add(hash);
  } catch {
    return { valid: false, error: "Nano payment could not be recorded" };
  }

  return {
    valid: true,
    blockHash: hash,
    payer: block.block_account ?? "",
    amount: paid.toString(),
  };
}
