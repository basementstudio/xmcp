export interface Configuration {
  apiKey: string;
  environment?: "production" | "sandbox";
}

// ── check() ──

export interface CheckResult {
  allowed: boolean;
  code: string;
  message: string;
  plan?: string;
  portalUrl?: string;
}

// ── track() ──

interface TrackUsageOptions {
  feature: string;
  units: number;
  model?: never;
  inputTokens?: never;
  outputTokens?: never;
  cacheReadTokens?: never;
  cacheWriteTokens?: never;
}

interface TrackTokensOptions {
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  units?: never;
}

export type TrackOptions = TrackUsageOptions | TrackTokensOptions;

export interface TrackResult {
  allowed: boolean;
  code: string;
  message: string;
  plan?: string;
  remaining?: number;
  included?: number;
  overage?: number;
  unlimited?: boolean;
  portalUrl?: string;
}
