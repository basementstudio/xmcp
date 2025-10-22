import { type ToolMetadata } from "xmcp";
import { useState } from "react";

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
    },
  },
};

export default function handler() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
