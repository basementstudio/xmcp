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
 * Tool handler is a React component (NOT async!)
 *
 * How it works:
 * 1. Handler is a React component function
 * 2. Framework detects .tsx file and SSR enabled
 * 3. Framework server-renders the component to HTML
 * 4. HTML is served via auto-generated resource at "ui://widget/get-pizza-map.html"
 *
 * IMPORTANT: React components cannot be async functions!
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
