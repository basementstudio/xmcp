"use client";

import { AnimatedLink } from "@/components/animated-link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Cross2Icon as X, HamburgerMenuIcon } from "@/components/ui/site-icons";

const MenuIcon = ({ isOpen }: { isOpen: boolean }) =>
  isOpen ? <X /> : <HamburgerMenuIcon />;

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="xl:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="flex size-11 items-center justify-center text-white hover:text-white/80 transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <MenuIcon isOpen={isOpen} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="w-full bg-black/95 border-white/10 data-[state=closed]:duration-500 z-110 motion-reduce:animate-none top-[72px] h-[calc(100dvh-72px)] overflow-y-auto"
        >
          <SheetClose
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-md border border-brand-neutral-500"
            aria-label="Close navigation"
          >
            <X />
          </SheetClose>
          <div className="flex flex-col items-center justify-center gap-8 mt-8 min-h-[60vh]">
            <nav aria-label="Main" className="flex flex-col items-center gap-6">
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
                  href="/templates"
                  className="text-white text-lg"
                  onClick={handleLinkClick}
                >
                  Templates
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
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <AnimatedLink
                  href="/faq"
                  className="text-white text-lg"
                  onClick={handleLinkClick}
                >
                  FAQ
                </AnimatedLink>
              </div>
              <AnimatedLink
                href="/changelog"
                className="text-white text-lg"
                onClick={handleLinkClick}
              >
                Changelog
              </AnimatedLink>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
