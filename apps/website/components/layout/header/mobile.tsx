"use client";

import { AnimatedLink } from "@/components/animated-link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { useState } from "react";

const MenuIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="w-5 h-5 relative">
    <div
      className={cn(
        "absolute w-full h-[1px] bg-white transition-all duration-300 ease-in-out rounded-full",
        isOpen
          ? "top-1/2 -translate-y-1/2 rotate-45"
          : "top-[22%] -translate-y-1/2"
      )}
    />

    <div
      className={cn(
        "absolute w-full h-[1px] bg-white transition-all duration-300 ease-in-out rounded-full",
        isOpen ? "hidden" : "top-1/2 -translate-y-1/2"
      )}
    />
    <div
      className={cn(
        "absolute w-full h-[1px] bg-white transition-all duration-300 ease-in-out rounded-full",
        isOpen
          ? "top-1/2 -translate-y-1/2 -rotate-45"
          : "top-[78%] -translate-y-1/2"
      )}
    />
  </div>
);

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden size-5">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="text-white hover:text-white/80 transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <MenuIcon isOpen={isOpen} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full bg-black/95 border-white/10 data-[state=closed]:duration-500 top-10"
        >
          <div className="flex flex-col items-center justify-center gap-8 mt-8 min-h-[60vh]">
            <nav className="flex flex-col items-center gap-6">
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <AnimatedLink
                  href="/docs"
                  className="text-white text-lg"
                  onClick={handleLinkClick}
                >
                  Docs
                </AnimatedLink>
              </div>
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <AnimatedLink
                  href="/examples"
                  className="text-white text-lg"
                  onClick={handleLinkClick}
                >
                  Examples
                </AnimatedLink>
              </div>
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <AnimatedLink
                  href="/showcase"
                  className="text-white text-lg"
                  onClick={handleLinkClick}
                >
                  Showcase
                </AnimatedLink>
              </div>
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <AnimatedLink
                  href="/blog"
                  className="text-white text-lg"
                  onClick={handleLinkClick}
                >
                  Blog
                </AnimatedLink>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
