import { Resend } from "resend";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Set ${name} before using this example.`);
  return value;
}

// Resolve credentials when a tool runs so builds do not need provider secrets.
export function getResend(): Resend {
  return new Resend(requiredEnv("RESEND_API_KEY"));
}
