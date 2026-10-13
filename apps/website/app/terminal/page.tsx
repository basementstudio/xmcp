"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { codeToHtml } from "shiki";
import { cn } from "../../utils/cn";
import { Button } from "@/components/ui/button";
import { xmcpAyuDarkTheme, xmcpLightTheme } from "@/lib/shiki-theme";

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

  const pendingSelection = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (pendingSelection.current === null) return;
    textareaRef.current?.setSelectionRange(
      pendingSelection.current,
      pendingSelection.current
    );
    pendingSelection.current = null;
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    const highlightCode = async () => {
      try {
        const html = await codeToHtml(code, {
          lang: "typescript",
          themes: { light: xmcpLightTheme, dark: xmcpAyuDarkTheme },
          defaultColor: false,
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
        if (!cancelled) setHighlightedCode(html);
      } catch (error) {
        console.error("Shiki highlighting failed:", error);
        if (!cancelled) setHighlightedCode("");
      }
    };

    highlightCode();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = code.substring(0, start) + "  " + code.substring(end);
      pendingSelection.current = start + 2;
      onCodeChange(newValue);
    }
  };

  return (
    <div id="terminal-output" className="w-full min-w-0">
      <div
        className={cn(
          "terminal-playground-editor relative w-full min-w-0 overflow-hidden",
          className
        )}
      >
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent text-transparent caret-white resize-none focus:outline-none z-10"
          aria-label="TypeScript code"
          placeholder=""
          spellCheck={false}
          style={{
            lineHeight: "24px",
            fontSize: "14px",
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            tabSize: 2,
          }}
        />

        <div
          className="p-4 pointer-events-none [&_.shiki-pre]:!bg-transparent [&_.shiki-pre]:!p-0 [&_.shiki-pre]:!m-0 [&_.shiki-code]:!font-mono [&_.shiki-code]:!text-sm"
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          <div
            style={{
              lineHeight: "24px",
              fontSize: "14px",
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
              tabSize: 2,
            }}
          >
            {highlightedCode ? (
              <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            ) : (
              code
            )}
          </div>
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
    <main id="main-content" className="site-page-grid site-page-stack">
      <header className="site-stack">
        <h1 className="display">Terminal playground</h1>
        <p>Edit a TypeScript snippet and save it as an image.</p>
      </header>
      <div className="site-stack">
        <div className="site-stack">
          <div className="min-w-0">
            <EditableTerminal code={code} onCodeChange={setCode} />
          </div>

          <Button onClick={downloadAsImage} className="self-start">
            Download image
          </Button>
        </div>
      </div>
    </main>
  );
}
