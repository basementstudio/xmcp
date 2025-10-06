"use client";

import { useState, useRef, useEffect } from "react";
import { codeToHtml } from "shiki";
import { cn } from "../../utils/cn";

function EditableTerminal({
  code,
  onCodeChange,
  className,
}: {
  code: string;
  onCodeChange: (newCode: string) => void;
  className?: string;
}) {
  const [highlightedCode, setHighlightedCode] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const html = await codeToHtml(code, {
          lang: "typescript",
          theme: "ayu-dark",
          transformers: [
            {
              pre(node) {
                delete node.properties.style;
                node.properties.class = "shiki-pre";
              },
              code(node) {
                delete node.properties.style;
                node.properties.class = "shiki-code";
              },
            },
          ],
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Shiki highlighting failed:", error);
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    };

    highlightCode();
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = code.substring(0, start) + "  " + code.substring(end);
      onCodeChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div id="terminal-output" className="mb-4">
      <div
        className={cn(
          "border relative bg-black min-w-[600px] overflow-hidden",
          className
        )}
        style={{ borderColor: "#333" }}
      >
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent text-transparent caret-white resize-none focus:outline-none z-10"
          placeholder=""
          spellCheck={false}
          style={{
            lineHeight: "24px",
            fontSize: "14px",
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
            whiteSpace: "pre",
            wordWrap: "break-word",
            tabSize: 2,
          }}
        />

        <div
          className="p-4 pointer-events-none [&_.shiki-pre]:!bg-transparent [&_.shiki-pre]:!p-0 [&_.shiki-pre]:!m-0 [&_.shiki-code]:!font-mono [&_.shiki-code]:!text-sm"
          style={{
            whiteSpace: "pre",
            wordWrap: "break-word",
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              lineHeight: "24px",
              fontSize: "14px",
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
              tabSize: 2,
            }}
          />
        </div>
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
          <div className="flex justify-center">
            <EditableTerminal code={code} onCodeChange={setCode} />
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
