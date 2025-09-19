"use client";

import { MenuIcon } from "lucide-react";
import { AnimatedLink } from "@/components/terminal/animated-link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export const MobileMenu = () => {
  return (
    <div className="sm:hidden size-5">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="text-white hover:text-white/80 transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full bg-black/95 border-white/10"
        >
          <SheetHeader>
            <SheetTitle className="text-white font-mono text-left hidden">
              Menu
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center gap-8 mt-8 min-h-[60vh]">
            <nav className="flex flex-col items-center gap-6">
              <SheetClose asChild>
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <AnimatedLink href="/docs" className="text-white text-lg">
                    Docs
                  </AnimatedLink>
                </div>
              </SheetClose>
              <SheetClose asChild>
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <AnimatedLink href="/examples" className="text-white text-lg">
                    Examples
                  </AnimatedLink>
                </div>
              </SheetClose>
              <SheetClose asChild>
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <AnimatedLink href="/showcase" className="text-white text-lg">
                    Showcase
                  </AnimatedLink>
                </div>
              </SheetClose>
              <SheetClose asChild>
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  <AnimatedLink href="/blog" className="text-white text-lg">
                    Blog
                  </AnimatedLink>
                </div>
              </SheetClose>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
