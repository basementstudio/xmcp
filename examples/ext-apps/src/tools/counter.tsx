import { InferSchema, type ToolMetadata } from "xmcp";
import { useState } from "react";
import { z } from "zod";

export const metadata: ToolMetadata = {
  name: "counter",
  description: "Counter React",
  _meta: {
    "ui/resourceUri": "ui://widget/counter.html",
  },
};

export const schema = {
  initialCount: z.number().describe("The name of the user to greet"),
};

export default function handler({ initialCount }: InferSchema<typeof schema>) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
