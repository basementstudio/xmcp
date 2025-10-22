"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/cn";
import gsap from "gsap";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import ts from "@shikijs/langs/typescript";
import bash from "@shikijs/langs/bash";
import ayuDark from "@shikijs/themes/ayu-dark";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import { CopyButton } from "@/components/ui/copy-button";
import { useFadeIn } from "@/lib/anim/use-fade-in";

const highlighter = createHighlighterCoreSync({
  langs: [ts, bash],
  themes: [ayuDark],
  engine: createJavaScriptRegexEngine(),
});

const steps = [
  {
    id: 1,
    title: "Create a new xmcp app",
    type: "command" as const,
    command: "npx create-xmcp-app@latest",
    output: `? What is your project named? my-server
? Select a package manager: pnpm
? Select the transport you want to use: HTTP (runs on a server)
? Select components to initialize:
  ◉ Tools
  ◉ Prompts
  ◉ Resources

✔ Creating a new xmcp app in ...
✔ Your xmcp app is ready

Next steps:
  cd my-server
  pnpm dev
`,
  },
  {
    id: 2,
    title: "Configure your environment",
    type: "file" as const,
    filename: "xmcp.config.ts",
    content: `import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3000,
    host: "0.0.0.0",
    endpoint: "/mcp",
    cors: {
      origin: "*",
      credentials: true,
    },
  },
};

export default config;`,
  },
  {
    id: 3,
    title: "Add tools, resources, and prompts",
    type: "file" as const,
    filename: "src/tools/get-weather.ts",
    content: `import { z } from "zod";
import { type InferSchema } from "xmcp";

export const schema = {
  location: z.string().describe("City name"),
};

export const metadata = {
  name: "get-weather",
  description: "Get current weather for a location",
};

export default async function getWeather({ 
  location 
}: InferSchema<typeof schema>) {
  // Your implementation here
  return \`Weather in \${location}: 72°F, Sunny\`;
}`,
  },
  {
    id: 4,
    title: "Deploy your server",
    type: "command" as const,
    command: "vc deploy",
    output: `Vercel CLI 37.0.0
Inspect: https://vercel.com/...
Production: https://my-server.vercel.app

Deployment Summary:
  • Environment: Production
  • Region: iad1
  • Build Time: 12s
  • Status: Ready

Your MCP server is live!`,
  },
];

const Terminal = ({ step }: { step: typeof steps[0] }) => {
  const highlightedContent = useMemo(() => {
    if (step.type === "file") {
      return highlighter.codeToHtml(step.content, {
        theme: "ayu-dark",
        lang: "typescript",
        defaultColor: false,
        transformers: [
          {
            name: "remove-background",
            pre: (node) => {
              if (node.properties.style) {
                const style = node.properties.style as string;
                node.properties.style = style.replace(
                  /background-color:[^;]+;?/g,
                  ""
                );
              }
            },
          },
        ],
      });
    }
    return null;
  }, [step]);

  if (step.type === "file") {
    return (
      <div className="bg-black border border-brand-neutral-400 rounded-xs overflow-hidden w-full min-h-[350px]">
        <div className="flex items-center gap-2 h-9.5 border-b px-4 border-brand-neutral-400 text-brand-neutral-100">
          <span className="flex-1 truncate text-sm font-mono">
            {step.filename}
          </span>
          <CopyButton text={step.content} className="size-6 top-0 -right-2" />
        </div>
        <div className="py-4 font-mono text-[13px] overflow-auto [&>pre]:!bg-transparent [&>pre]:p-0 [&>pre]:m-0 [&_*]:!text-[13px] [&_*]:!leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: highlightedContent || "" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border border-brand-neutral-400 rounded-xs overflow-hidden w-full min-h-[350px]">
      <div className="p-4 font-mono text-[13px] flex flex-col gap-3 overflow-auto">
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <span className="text-zinc-100">{step.command}</span>
        </div>
        <pre className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
          {step.output}
        </pre>
      </div>
    </div>
  );
};

const StepContent = ({ stepId }: { stepId: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const previousStepRef = useRef(stepId);
  const isAnimatingRef = useRef(false);
  const currentAnimationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    steps.forEach((step) => {
      const terminal = terminalRefs.current[step.id];
      if (!terminal) return;

      const isActive = step.id === stepId;

      if (isActive) {
        gsap.set(terminal, {
          y: 0,
          x: 0,
          scale: 1,
          opacity: 1,
          zIndex: 10,
          display: "flex",
          transformOrigin: "center center",
        });
      } else {
        gsap.set(terminal, {
          display: "none",
          opacity: 0,
        });
      }
    });
  }, [stepId]);

  useEffect(() => {
    if (stepId === previousStepRef.current) return;

    const currentTerminal = terminalRefs.current[stepId];
    const previousTerminal = terminalRefs.current[previousStepRef.current];

    if (!currentTerminal) {
      return;
    }

    // kill any existing animation
    if (currentAnimationRef.current) {
      currentAnimationRef.current.kill();
      currentAnimationRef.current = null;

      // ensure all terminals except the current one are hidden
      if (previousTerminal) {
        gsap.set(previousTerminal, {
          opacity: 0,
          display: "none",
        });
      }
    }

    previousStepRef.current = stepId;

    if (!previousTerminal) {
      gsap.set(currentTerminal, {
        display: "flex",
        y: 0,
        x: 0,
        scale: 1,
        opacity: 1,
        zIndex: 10,
      });

      steps.forEach((step) => {
        const terminal = terminalRefs.current[step.id];
        if (terminal && step.id !== stepId) {
          gsap.set(terminal, { display: "none" });
        }
      });

      return;
    }

    isAnimatingRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;

        // Hide all non-active terminals after animation
        steps.forEach((step) => {
          const terminal = terminalRefs.current[step.id];
          if (!terminal) return;

          if (step.id !== stepId) {
            gsap.set(terminal, { display: "none" });
          }
        });

        currentAnimationRef.current = null;
      },
    });

    currentAnimationRef.current = tl;

    // Set up the current terminal for animation
    gsap.set(currentTerminal, {
      display: "flex",
      zIndex: 10,
    });

    tl.to(
      previousTerminal,
      {
        scale: 0.98,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      },
      0
    ).fromTo(
      currentTerminal,
      {
        y: 60,
        filter: "blur(8px)",
        scale: 1,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power2.out",
      },
      0.1
    );
  }, [stepId]);

  useEffect(() => {
    return () => {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.kill();
        currentAnimationRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
    >
      {steps.map((step) => (
        <div
          key={step.id}
          ref={(el) => {
            terminalRefs.current[step.id] = el;
          }}
          data-step={step.id}
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
          style={{
            transformOrigin: "center center",
            display: step.id === stepId ? "flex" : "none",
            opacity: step.id === stepId ? 1 : 0,
          }}
        >
          <Terminal step={step} />
        </div>
      ))}
    </div>
  );
};

export const HomeSteps = () => {
  const [selectedStep, setSelectedStep] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStepChange = (newStep: number) => {
    setSelectedStep(newStep);
    setIsAutoPlaying(false);

    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 5000);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    autoPlayTimerRef.current = setInterval(() => {
      setSelectedStep((current) => {
        const nextStep = current >= steps.length ? 1 : current + 1;
        return nextStep;
      });
    }, 5000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isAutoPlaying]);

  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const fadeInRef = useMemo(() => [containerRef], []);

  useFadeIn({
    refs: fadeInRef,
    start: "top 75%",
  });

  return (
    <div className="w-full py-8 md:py-16 col-span-12 relative">
      <div className="md:hidden flex flex-col gap-12 md:gap-8">
        <div className="flex flex-col gap-2 md:px-4">
          <h2 className="heading-2 text-gradient">
            From zero to prod in seconds
          </h2>
        </div>

        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-4">
            <div className="md:px-4 flex items-start">
              <h3 className="text-[1.25rem] text-brand-white text-balance">
                {step.title}
              </h3>
            </div>
            <div className="w-full">
              <Terminal step={step} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:flex gap-12 flex-1" ref={containerRef}>
        <div className="hidden md:block absolute left-0 -bottom-10 w-[1px] bg-gradient-to-b from-transparent via-[#333333] to-transparent h-[130%]" />
        <div className="flex-1 flex flex-col relative">
          <div className="flex flex-col gap-2 lg:gap-4 px-4 py-8 relative">
            <AnimatedHeading
              effectDuration={2}
              fromY={0}
              className="text-4xl pb-1 -mb-1"
            >
              From zero to prod in seconds
            </AnimatedHeading>

            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-[#333333] to-transparent" />
          </div>

          <div className="relative py-8">
            <div className="flex flex-col gap-4 relative">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(step.id)}
                  className="flex items-start gap-6 text-left transition-all group cursor-pointer"
                >
                  <div
                    className={cn(
                      "absolute -left-4 mt-2 size-4 pr-4 flex items-center justify-center text-base flex-shrink-0 transition-all duration-200 ease-in-out border-r border-brand-neutral-300 text-brand-neutral-200 group-hover:text-brand-neutral-50 group-hover:border-brand-neutral-50 opacity-0 md:hidden xl:flex",
                      selectedStep === step.id &&
                        "text-brand-white border-brand-white xl:opacity-100"
                    )}
                  >
                    {step.id}
                  </div>

                  <div className="pt-1 pl-4">
                    <h3
                      className={cn(
                        "text-base text-brand-neutral-200 transition-all group-hover:text-brand-neutral-50",
                        selectedStep === step.id && "text-brand-white"
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-visible flex items-center justify-center">
          <StepContent stepId={selectedStep} />
        </div>
      </div>
    </div>
  );
};
