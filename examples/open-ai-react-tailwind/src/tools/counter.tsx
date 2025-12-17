import { InferSchema, type ToolMetadata } from "xmcp";
import { useState } from "react";
import { z } from "zod";
import "../../globals.css";

export const metadata: ToolMetadata = {
  name: "counter",
  description: "Counter React",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading counter",
        invoked: "Counter loaded",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

export const schema = {
  initialCount: z.number().describe("The initial count value"),
};

export default function handler({ initialCount }: InferSchema<typeof schema>) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Counter Display */}
        <div className="text-center mb-16">
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Counter
          </div>
          <div className="text-8xl font-light tracking-tight mb-2">{count}</div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCount(count - 1)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-sm font-mono uppercase tracking-wider"
            >
              Decrement
            </button>
            <button
              onClick={() => setCount(count + 1)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-sm font-mono uppercase tracking-wider"
            >
              Increment
            </button>
          </div>
          <button
            onClick={() => setCount(0)}
            className="w-full px-8 py-4 bg-white text-black hover:bg-zinc-200 transition-all duration-200 text-sm font-mono uppercase tracking-wider"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
