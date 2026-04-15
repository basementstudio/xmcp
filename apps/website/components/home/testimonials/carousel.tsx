"use client";

import * as React from "react";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function TestimonialsCarousel({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  const [api, setApi] = React.useState<CarouselApi>();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPausedByInteraction, setIsPausedByInteraction] =
    React.useState(false);
  const resumeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const pauseAutoPlay = React.useCallback(() => {
    setIsPausedByInteraction(true);

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      setIsPausedByInteraction(false);
    }, 5000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!api || items.length < 2 || isHovered || isPausedByInteraction) return;

    const autoPlayTimer = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(autoPlayTimer);
  }, [api, isHovered, isPausedByInteraction, items.length]);

  React.useEffect(() => {
    if (!api) return;

    api.on("pointerDown", pauseAutoPlay);

    return () => {
      api.off("pointerDown", pauseAutoPlay);
    };
  }, [api, pauseAutoPlay]);

  return (
    <div className="col-span-12">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: items.length > 1,
        }}
        className="w-full md:px-12"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CarouselContent className="-ml-0 md:-ml-5">
          {items.map((child, index) => (
            <CarouselItem
              key={index}
              className="pl-0 md:basis-1/2 md:pl-5 lg:basis-1/3"
            >
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>
        {items.length > 1 ? (
          <>
            <CarouselPrevious
              variant="secondary"
              size="icon-sm"
              className="left-0 hidden h-8 w-8 min-w-0 -translate-y-1/2 rounded-full border-brand-neutral-500 bg-brand-black text-brand-white hover:border-brand-neutral-300 hover:bg-brand-black disabled:opacity-40 disabled:hover:border-brand-neutral-500 md:flex"
              onPointerDownCapture={pauseAutoPlay}
            />
            <CarouselNext
              variant="secondary"
              size="icon-sm"
              className="right-0 hidden h-8 w-8 min-w-0 -translate-y-1/2 rounded-full border-brand-neutral-500 bg-brand-black text-brand-white hover:border-brand-neutral-300 hover:bg-brand-black disabled:opacity-40 disabled:hover:border-brand-neutral-500 md:flex"
              onPointerDownCapture={pauseAutoPlay}
            />
          </>
        ) : null}
      </Carousel>
    </div>
  );
}
