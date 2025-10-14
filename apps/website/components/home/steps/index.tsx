"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import gsap from "gsap";

const steps = [
  {
    id: 1,
    title: "Create a new xmcp app",
    type: "command" as const,
    command: "npx create-xmcp-app@latest",
    output: `? What is your project named? my-server
? Select a package manager: npm
? Select the transport you want to use: HTTP (runs on a server)
? Select components to initialize:
  ◉ Tools
  ◉ Prompts
  ◉ Resources

✓ Installing dependencies...
✓ Setting up project structure...

Success! Created my-server

Inside that directory, you can run:
  npm run dev    Start development server
  npm run build  Build for production`,
  },
  {
    id: 2,
    title: "Configure your environment",
    type: "file" as const,
    filename: "xmcp.config.ts",
    content: `import { defineConfig } from "xmcp";

export default defineConfig({
  name: "my-server",
  version: "1.0.0",
  transport: "http",
  server: {
    port: 3000,
  },
  // Configure your tools, resources, and prompts
});`,
  },
  {
    id: 3,
    title: "Add tools, resources, and prompts",
    type: "file" as const,
    filename: "src/tools/weather.ts",
    content: `import { tool } from "xmcp";
import { z } from "zod";

export const getWeather = tool({
  name: "get-weather",
  description: "Get current weather for a location",
  parameters: z.object({
    location: z.string().describe("City name"),
  }),
  execute: async ({ location }) => {
    // Your implementation here
    return \`Weather in \${location}: 72°F, Sunny\`;
  },
});`,
  },
  {
    id: 4,
    title: "Deploy your server",
    type: "command" as const,
    command: "vc deploy",
    output: `Vercel CLI 37.0.0
🔍 Inspect: https://vercel.com/...
✅ Production: https://my-server.vercel.app

📝 Deployment Summary:
  • Environment: Production
  • Region: iad1
  • Build Time: 12s
  • Status: Ready

🎉 Your MCP server is live!`,
  },
];

const Terminal = ({ step }: { step: (typeof steps)[0] }) => {
  if (step.type === "file") {
    return (
      <div className="bg-black border border-brand-neutral-400 rounded-xs overflow-hidden w-full min-h-[350px]">
        <div className="flex items-center gap-2 h-9.5 border-b px-4 border-brand-neutral-400 text-brand-neutral-100">
          <span className="flex-1 truncate text-sm font-mono">
            {step.filename}
          </span>
        </div>
        <div className="p-4 font-mono text-[13px] overflow-auto">
          <pre className="text-zinc-300 whitespace-pre leading-relaxed">
            {step.content}
          </pre>
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
          display: "block",
          transformOrigin: "center center",
        });
      } else {
        gsap.set(terminal, {
          display: "none",
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stepId === previousStepRef.current || isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    const currentTerminal = terminalRefs.current[stepId];
    const previousTerminal = terminalRefs.current[previousStepRef.current];

    if (!currentTerminal || !previousTerminal) {
      isAnimatingRef.current = false;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        previousStepRef.current = stepId;

        // Hide all non-active terminals after animation
        steps.forEach((step) => {
          const terminal = terminalRefs.current[step.id];
          if (!terminal) return;

          if (step.id !== stepId) {
            gsap.set(terminal, { display: "none" });
          }
        });
      },
    });

    // Always animate the same way (forward style)
    gsap.set(currentTerminal, {
      display: "block",
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
        scale: 1,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      },
      0.1
    );
  }, [stepId]);

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
          className="absolute top-1/2 left-0 w-full flex items-center justify-center -translate-y-1/2"
          style={{ transformOrigin: "center center" }}
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

  return (
    <div className="w-full py-8 md:py-16 col-span-12 relative">
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#333333] to-transparent" />

      <div className="md:hidden flex flex-col gap-12 md:gap-8">
        <div className="flex flex-col gap-4 md:px-4">
          <h2 className="heading-2 text-gradient">
            From zero to prod in seconds
          </h2>
          <p className="text-brand-neutral-100 text-base">
            Everything you need etc etc (this text could be opted out)
          </p>
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

      <div className="hidden md:flex gap-12 flex-1">
        <div className="flex-1 flex flex-col relative">
          <div className="flex flex-col gap-4 px-4 py-8 relative">
            <h2 className="text-4xl">From zero to prod in seconds</h2>
            <p className="text-brand-neutral-100 text-base">
              Everything you need etc etc (this text could be opted out)
            </p>

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
