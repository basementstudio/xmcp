"use client";

import { Tag } from "../../ui/tag";
import Image from "next/image";
import React, { useRef } from "react";
import Feature1 from "./feature-1.jpg";
import Feature2 from "./feature-2.jpg";
import Feature3 from "./feature-3.jpg";
import Feature4 from "./feature-4.jpg";
import Feature5 from "./feature-5.jpg";
import Feature6 from "./feature-6.jpg";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { AnimatedHeading } from "@/components/ui/animated-heading";

export const HomeFeatures = () => {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const cardRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]);

  if (cardRefs.current.length !== cards.length) {
    cardRefs.current = cards.map(() => ({
      current: null as HTMLDivElement | null,
    }));
  }

  useFadeIn({
    refs: [descriptionRef],
    stagger: 0.2,
    yOffset: 20,
  });

  useFadeIn({
    refs: cardRefs.current,
    stagger: 0.1,
    yOffset: 30,
    delay: 0.2,
  });

  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="flex flex-col items-start justify-center col-span-12 lg:col-span-9 lg:col-start-2 w-full mx-auto mb-8 gap-3">
        <Tag text="Features" animate />
        <div className="grid grid-cols-12 lg:grid-cols-9 gap-2 lg:gap-8 w-full">
          <AnimatedHeading
            effectDuration={2}
            className="heading-2 text-balance col-span-12 lg:col-span-4 mt-auto invisible"
          >
            The complete stack to ship an MCP server
          </AnimatedHeading>
          <p
            className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto invisible"
            ref={descriptionRef}
          >
            Everything you need to set up fast, customize with ease, and plug
            directly into your apps.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] col-span-12">
        {cards.map((card, index) => (
          <Card
            key={index}
            {...card}
            ref={(el: HTMLDivElement | null) => {
              if (cardRefs.current[index]) {
                cardRefs.current[index].current = el;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  asset: string;
  title: string;
  description: string;
  ref?: React.Ref<HTMLDivElement>;
}

const Card = ({ asset, title, description, ref }: CardProps) => {
  return (
    <div
      ref={ref}
      className="flex flex-col items-start justify-center p-4 rounded-xs border border-brand-neutral-500 max-h-[360px] h-full"
    >
      <div className="flex items-center justify-center w-full gap-2 mb-4">
        <Image
          src={asset}
          alt={title}
          className="mx-auto mix-blend-lighten bg-brand-black"
          width={245}
          height={200}
        />
      </div>
      <h3 className="text-brand-white mt-auto text-lg">{title}</h3>
      <p className="text-brand-neutral-100 pt-1">{description}</p>
    </div>
  );
};

Card.displayName = "Card";

const cards = [
  {
    asset: Feature1.src,
    title: "File System Routing",
    description:
      "Automatically register tools, prompts, and resources with zero configuration.",
  },
  {
    asset: Feature2.src,
    title: "Integrations",
    description:
      "Secure access with Better Auth's integration and monetize with Polar.",
  },
  {
    asset: Feature3.src,
    title: "Middlewares",
    description:
      "Add authentication, logging, or custom logic to intercept and process requests and responses.",
  },
  {
    asset: Feature4.src,
    title: "Extensible Configuration",
    description:
      "Customize every aspect of your MCP server with flexible configuration options.",
  },

  {
    asset: Feature5.src,
    title: "Multiple Transport Support",
    description:
      "Build and deploy servers with HTTP or STDIO transport protocols out of the box.",
  },

  {
    asset: Feature6.src,
    title: "Plug & play to your apps",
    description:
      "Initialize xmcp directly in your existing Next.js or Express projects with one command.",
  },
];
