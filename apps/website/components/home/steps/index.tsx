"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const steps = [
  {
    id: 1,
    title: "Get started with creating a new xmcp app",
  },
  {
    id: 2,
    title: "Configure your environment",
  },
  {
    id: 3,
    title: "Add tools and resources",
  },
  {
    id: 4,
    title: "Deploy your server",
  },
];

const StepContent = ({ stepId }: { stepId: number }) => {
  const placeholders = [
    <div
      key={1}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full h-full min-h-[400px] flex items-center justify-center"
    >
      <div className="font-mono text-sm text-zinc-400">
        <pre>{`function helloWorld() {
  console.log("Hello, Magic!");
}`}</pre>
      </div>
    </div>,
    <div
      key={2}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full h-full min-h-[400px] flex items-center justify-center"
    >
      <div className="text-zinc-400">Step 2 content placeholder</div>
    </div>,
    <div
      key={3}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full h-full min-h-[400px] flex items-center justify-center"
    >
      <div className="text-zinc-400">Step 3 content placeholder</div>
    </div>,
    <div
      key={4}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full h-full min-h-[400px] flex items-center justify-center"
    >
      <div className="text-zinc-400">Step 4 content placeholder</div>
    </div>,
  ];

  return placeholders[stepId - 1];
};

export const Steps = () => {
  const [selectedStep, setSelectedStep] = useState(1);

  return (
    <div className="w-full py-16 col-span-12 relative">
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#333333] to-transparent" />

      <div className="md:hidden flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:px-4">
          <h2 className="text-4xl">From zero to prod in seconds</h2>
          <p className="text-brand-neutral-100 text-base">
            Everything you need etc etc (this text could be opted out)
          </p>
        </div>

        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-4">
            <div className="md:px-4 flex items-start gap-3">
              <span className="text-[1.25rem] text-brand-white flex-shrink-0">
                {step.id}.
              </span>
              <h3 className="text-[1.25rem] text-brand-white text-balance">
                {step.title}
              </h3>
            </div>
            <div className="w-full">
              <StepContent stepId={step.id} />
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
                  onClick={() => setSelectedStep(step.id)}
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

        <div className="flex-1">
          <StepContent stepId={selectedStep} />
        </div>
      </div>
    </div>
  );
};
