"use client";

import { useRef, useState, useEffect, useCallback, Children } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TestimonialsCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isResetting = useRef(false);
  const childCount = Children.count(children);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getCardDistance = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 360;
    const card = el.querySelector<HTMLElement>(":scope > *");
    return (card?.offsetWidth ?? 340) + 20;
  }, []);

  const getSetWidth = useCallback(() => {
    return getCardDistance() * childCount;
  }, [getCardDistance, childCount]);

  // Start at the middle set
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = getSetWidth();
  }, [getSetWidth]);

  // Reset scroll position when reaching the cloned edges
  const handleScroll = useCallback(() => {
    if (isResetting.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const setWidth = getSetWidth();

    if (el.scrollLeft <= 0) {
      isResetting.current = true;
      el.style.scrollBehavior = "auto";
      el.scrollLeft += setWidth;
      el.style.scrollBehavior = "";
      isResetting.current = false;
    } else if (el.scrollLeft >= setWidth * 2) {
      isResetting.current = true;
      el.style.scrollBehavior = "auto";
      el.scrollLeft -= setWidth;
      el.style.scrollBehavior = "";
      isResetting.current = false;
    }
  }, [getSetWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -getCardDistance() : getCardDistance(),
      behavior: "smooth",
    });
  }, [getCardDistance]);

  const pauseAutoPlay = useCallback(() => {
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
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!isAutoPlaying) return;

    autoPlayTimerRef.current = setInterval(() => {
      scroll("right");
    }, 5000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isAutoPlaying, scroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleArrowClick = (direction: "left" | "right") => {
    scroll(direction);
    pauseAutoPlay();
  };

  return (
    <div className="col-span-12 flex items-center gap-4">
      <button
        onClick={() => handleArrowClick("left")}
        className="hidden md:flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full border border-brand-neutral-500 bg-brand-black hover:border-brand-neutral-300 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4 text-brand-white" />
      </button>
      <div
        className="relative overflow-hidden flex-1"
        onMouseEnter={() => pauseAutoPlay()}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-brand-black to-transparent z-10 pointer-events-none" />
        <div
          ref={scrollRef}
          className="flex gap-[20px] overflow-x-auto pb-4 px-16 scrollbar-hide scroll-smooth snap-x snap-mandatory"
        >
          {children}
          {children}
          {children}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-brand-black to-transparent z-10 pointer-events-none" />
      </div>
      <button
        onClick={() => handleArrowClick("right")}
        className="hidden md:flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full border border-brand-neutral-500 bg-brand-black hover:border-brand-neutral-300 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4 text-brand-white" />
      </button>
    </div>
  );
}
