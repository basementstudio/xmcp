import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so metadata lives in this layout.
export const metadata: Metadata = {
  title: "Terminal - xmcp",
  description: "Editable terminal playground for xmcp code snippets.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://xmcp.dev/terminal",
  },
};

export default function TerminalLayout({ children }: { children: ReactNode }) {
  return children;
}
