import { useState } from "react";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-pizza-map",
  description: "Show Pizza Map",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Hand-tossing a map",
        invoked: "Served a fresh map",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

/**
 * Tool handler is a React Client component
 *
 * If you need async data, use useEffect or server-side data fetching patterns.
 */
export default function handler() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)} style={{ marginLeft: 8 }}>
        Decrement
      </button>
      <button onClick={() => setCount(0)} style={{ marginLeft: 8 }}>
        Reset
      </button>
    </div>
  );
}
