import type { McpMiddleware, McpMiddlewareContext } from "xmcp";

export interface UsageEvent {
  /** Generated once per admitted execution round; retain across delivery retries. */
  readonly id: string;
  readonly customerId: string;
  readonly tool: string;
  readonly units: number;
  readonly timestamp: string;
}
type ToolContext = Extract<McpMiddlewareContext, { method: "tools/call" }>;
export interface UsageBillingOptions {
  customer: (
    context: ToolContext
  ) => string | undefined | Promise<string | undefined>;
  units?: number | ((context: ToolContext) => number | Promise<number>);
  /** Atomically persist the event and debit any credits. False denies execution.
   * Must complete durably before resolving true. Throwing also denies execution. */
  admit: (event: UsageEvent) => Promise<boolean>;
}
const denied = (text: string) => ({
  isError: true as const,
  content: [{ type: "text" as const, text }],
});

/** Meter admitted attempts before execution; storage and credit policy are application-owned. */
export function usageBilling(options: UsageBillingOptions): McpMiddleware {
  return async (context, next) => {
    if (context.method !== "tools/call") return next();
    context.signal.throwIfAborted();
    const customerId = await options.customer(context);
    context.signal.throwIfAborted();
    if (!customerId?.trim())
      return denied("A verified billing customer is required.");
    const units =
      typeof options.units === "function"
        ? await options.units(context)
        : (options.units ?? 1);
    if (!Number.isSafeInteger(units) || units < 1)
      throw new Error("Billing units must be a positive safe integer.");
    context.signal.throwIfAborted();
    let admitted: boolean;
    try {
      admitted = await options.admit(
        Object.freeze({
          id: crypto.randomUUID(),
          customerId,
          tool: context.params.name,
          units,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      context.signal.throwIfAborted();
      return denied("Usage could not be recorded. Please try again later.");
    }
    context.signal.throwIfAborted();
    if (admitted !== true) return denied("Usage allowance exhausted.");
    // An admission is billable even if the handler fails, needs input, or is
    // cancelled. Delivery retries reuse the stored event, never this callback.
    return next();
  };
}

export interface UsageDeliveryOptions {
  secretKey: string;
  eventName: string;
  fetch?: typeof globalThis.fetch;
}
// Bound a worker delivery attempt; the durable outbox retains failures for retry.
const DELIVERY_TIMEOUT_MS = 15_000;
function validate(event: UsageEvent): void {
  if (
    !event.id ||
    !event.customerId ||
    !Number.isSafeInteger(event.units) ||
    event.units < 1 ||
    !Number.isFinite(Date.parse(event.timestamp))
  )
    throw new Error("Invalid stored usage event.");
}
export function stripeMeterEvents(options: UsageDeliveryOptions) {
  return async (event: UsageEvent): Promise<void> => {
    validate(event);
    const body = new URLSearchParams({
      event_name: options.eventName,
      identifier: event.id,
      timestamp: String(Math.floor(Date.parse(event.timestamp) / 1000)),
      "payload[stripe_customer_id]": event.customerId,
      "payload[value]": String(event.units),
    });
    const response = await (options.fetch ?? fetch)(
      "https://api.stripe.com/v1/billing/meter_events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": event.id,
        },
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      }
    );
    if (!response.ok)
      throw new Error(`Stripe usage delivery failed (${response.status}).`);
  };
}
export function metronomeEvents(options: UsageDeliveryOptions) {
  return async (event: UsageEvent): Promise<void> => {
    validate(event);
    const response = await (options.fetch ?? fetch)(
      "https://api.metronome.com/v1/ingest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            transaction_id: event.id,
            customer_id: event.customerId,
            event_type: options.eventName,
            timestamp: event.timestamp,
            properties: { units: event.units, tool: event.tool },
          },
        ]),
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      }
    );
    if (!response.ok)
      throw new Error(`Metronome usage delivery failed (${response.status}).`);
  };
}
