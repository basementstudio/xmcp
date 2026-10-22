import { randomUUID } from "node:crypto";

export type PluginInfo = {
  sessionId: string;
  pageId: string;
  documentName: string;
  pageName: string;
};
export type Command = {
  id: string;
  pageId: string;
  operation: string;
  arguments: Record<string, unknown>;
};
export type PluginResult = {
  content: (
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  )[];
  isError?: boolean;
};

// Release idle HTTP polls periodically; the plugin immediately starts the next poll.
export const POLL_TIMEOUT_MS = 25_000;
// Bound canvas operations, including font loading. A timeout never retries a write.
export const COMMAND_TIMEOUT_MS = 30_000;

export class FigmaBridge {
  private waiting?: {
    info: PluginInfo;
    deliver: (command: Command | null) => void;
  };
  private active?: {
    info: PluginInfo;
    id: string;
    finish: (result: PluginResult) => void;
  };

  status() {
    const info = this.active?.info ?? this.waiting?.info;
    return { connected: Boolean(info), busy: Boolean(this.active), ...info };
  }

  async poll(info: PluginInfo, signal: AbortSignal): Promise<Command | null> {
    if (this.waiting || this.active)
      throw new Error("A plugin is already connected or executing a command.");
    signal.throwIfAborted();
    return new Promise((resolve) => {
      const finish = (command: Command | null) => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
        if (this.waiting?.deliver === finish) this.waiting = undefined;
        resolve(command);
      };
      const abort = () => finish(null);
      const timer = setTimeout(() => finish(null), POLL_TIMEOUT_MS);
      this.waiting = { info, deliver: finish };
      signal.addEventListener("abort", abort, { once: true });
    });
  }

  async execute(
    sessionId: string,
    operation: string,
    args: Record<string, unknown>
  ): Promise<PluginResult> {
    const waiting = this.waiting;
    if (!waiting || waiting.info.sessionId !== sessionId) {
      throw new Error(
        "Connect the Figma plugin, wait until it is ready, and use its current sessionId from figma-status."
      );
    }
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.active = undefined;
        reject(
          new Error(
            "Figma did not respond in time. The operation may have executed; inspect the file before retrying."
          )
        );
      }, COMMAND_TIMEOUT_MS);
      this.active = {
        info: waiting.info,
        id,
        finish: (result) => {
          clearTimeout(timer);
          this.active = undefined;
          resolve(result);
        },
      };
      waiting.deliver({
        id,
        pageId: waiting.info.pageId,
        operation,
        arguments: args,
      });
    });
  }

  complete(sessionId: string, id: string, result: PluginResult): boolean {
    if (this.active?.id !== id || this.active.info.sessionId !== sessionId)
      return false;
    this.active.finish(result);
    return true;
  }
}

// A single local plugin connection; this is not a distributed job queue.
export const bridge = new FigmaBridge();
