"use client";

import { useState } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import ts from "@shikijs/langs/typescript";
import ayuDark from "@shikijs/themes/ayu-dark";
import { cn } from "@/utils/cn";

const highlighter = createHighlighterCoreSync({
  langs: [ts],
  themes: [ayuDark],
  engine: createJavaScriptRegexEngine(),
});

function SyntaxTerminal({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  if (!code.trim()) {
    return (
      <div id="terminal-output" className="mb-4">
        <div
          className={cn("border relative bg-black p-4 inline-block", className)}
          style={{ borderColor: "#333" }}
        >
          <div className="min-h-[200px] flex items-center justify-center">
            <span className="text-gray-500">No code to preview</span>
          </div>
        </div>
      </div>
    );
  }

  const codeHTML = highlighter.codeToHtml(code, {
    theme: "ayu-dark",
    lang: "typescript",
  });

  return (
    <div id="terminal-output" className="mb-4">
      <div
        className={cn(
          "border relative bg-black p-4 pb-8 [&_span]:!font-mono inline-block",
          className
        )}
        style={{ borderColor: "#333" }}
      >
        <div
          className="[&>pre]:p-0 [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!leading-6 [&_*]:!text-sm [&_*]:!font-mono [&>pre>code]:!block [&>pre>code]:!pb-2"
          dangerouslySetInnerHTML={{ __html: codeHTML }}
        />
      </div>
    </div>
  );
}

export default function TerminalPage() {
  const [code, setCode] = useState(`import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, World!");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});`);

  const downloadAsImage = async () => {
    const element = document.getElementById("terminal-output");
    if (!element) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `terminal-code.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col gap-8 max-w-none">
          <div className="space-y-4">
            <div>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none overflow-auto"
                placeholder="Enter your TypeScript code here..."
              />
            </div>
          </div>

          <div className="flex justify-center">
            <SyntaxTerminal code={code} />
          </div>

          <button
            onClick={downloadAsImage}
            className="w-[200px] mx-auto bg-white text-black py-3 px-4 font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase"
          >
            Download as Image
          </button>
        </div>
      </div>
    </div>
  );
}
