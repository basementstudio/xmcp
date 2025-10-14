"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import gsap from "gsap";

const steps = [
  {
    id: 1,
    title: "Get started with creating a new xmcp app",
    command: "npx create-xmcp-app@latest my-server",
    output: `Creating a new xmcp app in /my-server...

✓ Installing dependencies...
✓ Setting up project structure...
✓ Generating configuration files...

Success! Created my-server at /my-server

Inside that directory, you can run:
  npm run dev    Start development server
  npm run build  Build for production`,
  },
  {
    id: 2,
    title: "Configure your environment",
    command: "cat xmcp.config.ts",
    output: `import { defineConfig } from "xmcp";

export default defineConfig({
  transport: "stdio",
  // Add your configuration here
});`,
  },
  {
    id: 3,
    title: "Add tools and resources",
    command: "npm run dev",
    output: `> my-server@1.0.0 dev
> xmcp dev

🚀 Server started
📦 Loaded 3 tools
📚 Loaded 2 resources
🔧 Ready to accept connections

Available tools:
  • get-weather
  • send-email  
  • search-database`,
  },
  {
    id: 4,
    title: "Deploy your server",
    command: "npm run build && npm run start",
    output: `> my-server@1.0.0 build
> xmcp build

✓ Compiled successfully
✓ Output written to ./dist

> my-server@1.0.0 start  
> node dist/index.js

🎉 Production server running
🌐 Listening on port 3000`,
  },
];

const Terminal = ({ step }: { step: (typeof steps)[0] }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl w-full h-full">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-2 relative">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 text-center text-xs text-zinc-500 font-mono absolute left-0 right-0">
          terminal — step {step.id}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-6 font-mono text-sm min-h-[400px] flex flex-col gap-4">
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

  // Initialize terminal positions on mount
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
          transformOrigin: "center top",
        });
      } else {
        gsap.set(terminal, {
          display: "none",
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate step changes
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
        scale: 0.95,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
      },
      0
    ).fromTo(
      currentTerminal,
      {
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
        scale: 1,
        opacity: 1,
      },
      {
        y: 0,
        duration: 0.4,
        ease: "power2.inOut",
      },
      0
    );
  }, [stepId]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      {steps.map((step) => (
        <div
          key={step.id}
          ref={(el) => {
            terminalRefs.current[step.id] = el;
          }}
          data-step={step.id}
          className="absolute top-0 left-0 w-full"
          style={{ transformOrigin: "center top" }}
        >
          <Terminal step={step} />
        </div>
      ))}
    </div>
  );
};

export const HomeSteps = () => {
  const [selectedStep, setSelectedStep] = useState(1);

  const handleStepChange = (newStep: number) => {
    setSelectedStep(newStep);
  };

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

        <div className="flex-1 overflow-visible">
          <StepContent stepId={selectedStep} />
        </div>
      </div>
    </div>
  );
};
