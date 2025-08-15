"use client";

import { cn } from "@/utils/cn";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { CopyButton } from "@/components/ui/copy-button";

export type ShowcaseItem = {
  title: string;
  description: string;
  category: string;
  github?: string;
  logo: string;
  stars?: number;
  connection: {
    type: "HTTP" | "CLI";
    value: string;
  };
};

export const mockMcps: ShowcaseItem[] = [
  {
    title: "Weather Oracle",
    description:
      "Real-time weather data and forecasts with location-based insights for any city worldwide",
    category: "Data & APIs",
    github: "https://github.com/example/weather-oracle",
    logo: "/showcase/bshb.png",
    stars: 2847,
    connection: {
      type: "HTTP",
      value: "https://weather-oracle.example.com/mcp",
    },
  },
  {
    title: "Code Reviewer",
    description:
      "Automated code review and analysis tool with security vulnerability detection",
    category: "Developer Tools",
    github: "https://github.com/example/code-reviewer",
    logo: "/showcase/bshb.png",
    stars: 1593,
    connection: {
      type: "CLI",
      value: "npx code-reviewer-mcp",
    },
  },
  {
    title: "Database Explorer",
    description:
      "Query and explore SQL databases with natural language interface and schema visualization",
    category: "Database",
    github: "https://github.com/example/db-explorer",
    logo: "/showcase/bshb.png",
    stars: 742,
    connection: {
      type: "CLI",
      value: "npx db-explorer-mcp --config ./db.json",
    },
  },
  {
    title: "Task Manager Pro",
    description:
      "Advanced task management with project tracking, time analytics, and team collaboration",
    category: "Productivity",
    github: "https://github.com/example/task-manager",
    logo: "/showcase/bshb.png",
    stars: 1204,
    connection: {
      type: "HTTP",
      value: "https://api.taskmanager.pro/mcp",
    },
  },
  {
    title: "Email Assistant",
    description:
      "Smart email management with automated responses, filtering, and priority detection",
    category: "Communication",
    github: "https://github.com/example/email-assistant",
    logo: "/showcase/bshb.png",
    stars: 3156,
    connection: {
      type: "CLI",
      value: "npx email-assistant-mcp --auth-token $EMAIL_TOKEN",
    },
  },
  {
    title: "File Organizer",
    description:
      "Intelligent file organization and management with AI-powered categorization",
    category: "Utilities",
    github: "https://github.com/example/file-organizer",
    logo: "/showcase/bshb.png",
    stars: 891,
    connection: {
      type: "CLI",
      value: "npx file-organizer-mcp",
    },
  },
  {
    title: "Enterprise Analytics",
    description:
      "Professional business intelligence and analytics platform with advanced reporting capabilities",
    category: "Business",
    logo: "/showcase/bshb.png",
    connection: {
      type: "HTTP",
      value: "https://analytics.enterprise.com/mcp",
    },
  },
];

export function ShowcaseCards() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(mockMcps.map((mcp) => mcp.category))),
  ];

  const filteredMcps =
    selectedCategory === "All"
      ? mockMcps
      : mockMcps.filter((mcp) => mcp.category === selectedCategory);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-8">
          <h2 className="text-xl uppercase mb-4">From the community</h2>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "text-xs px-3 py-2 border uppercase tracking-wide transition-colors cursor-pointer",
                  selectedCategory === category
                    ? "border-white text-white bg-white/10"
                    : "border-white/20 text-white/60 hover:text-white hover:border-white/40"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMcps.map((mcp, index) => (
            <ShowcaseCard key={index} {...mcp} />
          ))}
        </div>

        {filteredMcps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#BABABA] text-sm">
              No MCP servers found in the &quot;{selectedCategory}&quot;
              category.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export function ShowcaseCard({
  className,
  ...item
}: {
  className?: string;
} & ShowcaseItem) {
  const { title, description, category, github, logo, stars, connection } =
    item;
  return (
    <div
      className={cn(
        "text-left group relative overflow-visible h-full",
        className
      )}
    >
      <div
        className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible"
        style={{ borderColor: "#333" }}
      />
      <div
        className="relative border border-muted p-4 group-hover:bg-black h-full min-h-[12rem] w-full flex flex-col"
        style={{ borderColor: "#333" }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded overflow-hidden">
            <Image
              src={logo}
              alt={`${title} logo`}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              {github ? (
                <Link
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="italic text-white font-medium hover:underline"
                >
                  {title}{" "}
                  <span className="invisible group-hover:visible text-sm">
                    {"→"}
                  </span>
                </Link>
              ) : (
                <h3 className="italic text-white font-medium">{title}</h3>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-sm text-[#BABABA] leading-relaxed">
              {description}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 uppercase tracking-wide">
                  {connection.type}
                </span>
              </div>

              <div className="bg-black/20 border border-white/10 rounded px-2 py-1 relative group/copy">
                <code className="text-xs text-[#BABABA] font-mono break-all pr-8">
                  {connection.value}
                </code>
                <CopyButton
                  text={connection.value}
                  className="absolute top-1 right-3 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
              {category}
            </span>
            <div className="flex items-center gap-2">
              {stars && (
                <div className="flex items-center gap-1 text-xs text-[#BABABA] group-hover:text-white transition-colors">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {stars.toLocaleString()}
                </div>
              )}
              {github && (
                <Link
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:scale-110 transition-transform"
                  aria-label="View on GitHub"
                >
                  <svg
                    className="w-4 h-4 text-[#BABABA] hover:text-white transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
