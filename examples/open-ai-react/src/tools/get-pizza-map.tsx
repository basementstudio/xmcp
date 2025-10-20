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
 * Tool handler is a React client component (NOT async)
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
  return (
    <>
      <div id="pizzaz-root" />
      <link
        rel="stylesheet"
        href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css"
      />
      <script
        async
        type="module"
        src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"
      />
    </>
  );
}
