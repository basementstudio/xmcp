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
            <span className="text-gray-500">
              Enter TypeScript code to see syntax highlighting...
            </span>
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
  const [code, setCode] = useState(`// Welcome to the Terminal Generator
import { createServer } from "http";

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
      // Dynamically import html2canvas to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // Higher quality
        useCORS: true,
      });

      // Create download link
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            TypeScript Terminal Generator
          </h1>
          <p className="text-white max-w-2xl mx-auto">
            Enter TypeScript code and generate beautiful terminal-styled images
            perfect for presentations or social media.
          </p>
        </div>

        <div className="flex flex-col gap-8 max-w-none">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                TypeScript Code
              </label>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none overflow-auto"
                placeholder="Enter your TypeScript code here..."
              />
            </div>

            <button
              onClick={downloadAsImage}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Download as Image
            </button>
          </div>

          {/* Preview Section */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">Preview</h3>
            <div className="flex justify-center">
              <SyntaxTerminal code={code} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
