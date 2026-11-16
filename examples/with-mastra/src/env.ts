import { timingSafeEqual } from "node:crypto";

export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

/** Checks an Authorization header against `Bearer <token>` in constant time. */
export function isBearer(
  header: string | null | undefined,
  token: string | undefined
): boolean {
  if (!header || !token?.trim()) return false;
  const received = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${token}`);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}
