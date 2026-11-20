"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { tagClassName } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { GUIDE_TOPIC_LABELS, type GuideTopic } from "@/lib/guide-topics";

export interface GuideSummary {
  slug: string;
  title: string;
  description?: string;
  topic?: GuideTopic;
  date?: string;
  dateLabel?: string;
}

type ViewMode = "grid" | "list";

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "list", label: "List" },
];

interface GuidesListingProps {
  guides: GuideSummary[];
  topics: GuideTopic[];
}

export function GuidesListing({ guides, topics }: GuidesListingProps) {
  const [topic, setTopic] = useState<GuideTopic | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const visibleGuides = topic
    ? guides.filter((guide) => guide.topic === topic)
    : guides;

  return (
    <>
      <div className="guides-toolbar">
        <div
          role="group"
          aria-label="Filter by topic"
          className="guides-topic-filter edge-fade-x"
        >
          <ToggleChip selected={topic === null} onClick={() => setTopic(null)}>
            All
          </ToggleChip>
          {topics.map((id) => (
            <ToggleChip
              key={id}
              selected={topic === id}
              onClick={() => setTopic(id)}
            >
              {GUIDE_TOPIC_LABELS[id]}
            </ToggleChip>
          ))}
        </div>
        <div role="group" aria-label="View" className="guides-view-toggle">
          {VIEW_MODES.map((mode) => (
            <ToggleChip
              key={mode.id}
              selected={view === mode.id}
              onClick={() => setView(mode.id)}
            >
              {mode.label}
            </ToggleChip>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {visibleGuides.length} guides
      </p>
      {view === "grid" ? (
        <GuidesGrid guides={visibleGuides} />
      ) : (
        <GuidesList guides={visibleGuides} />
      )}
    </>
  );
}

function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn("shrink-0", tagClassName({ interactive: true, selected }))}
    >
      {children}
    </button>
  );
}

function GuidesGrid({ guides }: { guides: GuideSummary[] }) {
  return (
    <div className="site-card-grid">
      {guides.map((guide) => (
        <ContentCard key={guide.slug} href={`/blog/${guide.slug}`}>
          <h2 className="site-card-title">{guide.title}</h2>
          <p className="site-card-description">{guide.description}</p>
        </ContentCard>
      ))}
    </div>
  );
}

function GuidesList({ guides }: { guides: GuideSummary[] }) {
  return (
    <ul className="blog-post-list" aria-label="Guides">
      {guides.map((guide) => (
        <li key={guide.slug}>
          <Link
            href={`/blog/${guide.slug}`}
            className="blog-post-row link-underline-group"
          >
            <span className="blog-post-date">
              {guide.date && (
                <time dateTime={guide.date}>{guide.dateLabel}</time>
              )}
            </span>
            <h2>
              <span className="link-underline-label">{guide.title}</span>
            </h2>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
