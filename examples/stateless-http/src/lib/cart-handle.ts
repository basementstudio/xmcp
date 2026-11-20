import { createHmac, timingSafeEqual } from "node:crypto";

export interface CartItem {
  sku: string;
  quantity: number;
}

function signingKey() {
  const secret = process.env.CART_HANDLE_SECRET;
  if (!secret) {
    throw new Error("Set CART_HANDLE_SECRET to sign cart handles");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function mintCartHandle(items: CartItem[]) {
  const payload = Buffer.from(JSON.stringify(items)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readCartHandle(handle: string): CartItem[] {
  const [payload, signature] = handle.split(".");
  if (!payload || !signature) {
    throw new Error("Malformed cart handle");
  }
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error("Cart handle was not issued by this server");
  }
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}
