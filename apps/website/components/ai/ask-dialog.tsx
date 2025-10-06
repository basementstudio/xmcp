"use client";

import {
  type ComponentProps,
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "fumadocs-core/link";
import { type UIMessage, useChat, type UseChatHelpers } from "@ai-sdk/react";
import type { ProvideLinksToolSchema } from "@/lib/inkeep-qa-schema";
import type { z } from "zod";
import { DefaultChatTransport } from "ai";
import { Markdown } from "@/components/markdown";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { Icons } from "../icons";

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<UIMessage>;
} | null>(null);

function useChatContext() {
  return use(Context)!.chat;
}

function AskAIActions({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const { messages, status, setMessages, regenerate } = useChatContext();

  if (messages.length === 0 && !alwaysShow) return null;

  const hasMessages = messages.length > 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        disabled={!hasMessages}
      >
        <Icons.clipboard className="size-4 text-brand-white" />
      </button>
      <button
        type="button"
        onClick={() => regenerate()}
        className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        disabled={
          !hasMessages ||
          status === "streaming" ||
          messages.at(-1)?.role === "assistant"
        }
      >
        <Icons.retry className="size-5 text-brand-white" />
      </button>
      <button
        type="button"
        className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        onClick={() => setMessages([])}
        disabled={!hasMessages}
      >
        <Icons.trash className="size-4 text-brand-white" />
      </button>
    </div>
  );
}

function AskAIInput(props: ComponentProps<"div">) {
  const { status, sendMessage } = useChatContext();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = status === "streaming" || status === "submitted";
  const onStart = () => {
    if (input.trim()) {
      void sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div {...props} className={cn("flex items-center gap-2", props.className)}>
      <input
        ref={inputRef}
        id="ask-ai-input"
        type="text"
        value={input}
        placeholder="Ask AI anything..."
        className="w-0 flex-1 text-lg placeholder:text-brand-neutral-100 focus-visible:!outline-none focus:outline-none leading-none"
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (status === "streaming" || status === "submitted") {
            return;
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onStart();
          }
        }}
      />
      {isLoading ? (
        <button key="bn" type="button">
          <Loader2 className="size-4 animate-spin text-brand-neutral-100" />
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <button
            key="bn"
            type="button"
            className="transition-opacity duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed text-brand-white focus-visible:outline"
            disabled={input.length === 0}
            onClick={onStart}
          >
            <Icons.send className="size-5" />
          </button>
          <button
            key="bn2"
            type="button"
            className="transition-opacity duration-200 shrink-0 text-brand-white focus-visible:outline text-sm font-mono"
            onClick={() => {}}
          >
            ESC
          </button>
        </div>
      )}
    </div>
  );
}

function List(props: Omit<ComponentProps<"div">, "dir">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "instant",
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      const viewport = element.firstElementChild!;

      element.style.setProperty(
        "--fd-animated-height",
        `${viewport.clientHeight}px`
      );
    });

    const viewport = element.firstElementChild;
    if (viewport) observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "overflow-hidden h-(--fd-animated-height) transition-[height]",
        props.className
      )}
    >
      <div
        ref={containerRef}
        className="sidebar-scrollbar overflow-y-auto min-w-0 flex flex-col max-h-[400px] p-4"
      >
        {props.children}
      </div>
    </div>
  );
}

function Message({
  message,
  ...props
}: { message: UIMessage } & ComponentProps<"div">) {
  let markdown = "";
  let links: z.infer<typeof ProvideLinksToolSchema>["links"] = [];

  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      markdown += part.text;
      continue;
    }

    if (part.type === "tool-provideLinks" && part.input) {
      links = (part.input as z.infer<typeof ProvideLinksToolSchema>).links;
    }
  }

  const isUser = message.role === "user";

  return (
    <div
      {...props}
      className={cn(
        "flex flex-col gap-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
        props.className
      )}
    >
      <div
        className={cn(
          "rounded-xs px-1 transition-all duration-200",
          isUser &&
            "bg-white/10 text-end max-w-fit ml-auto leading-none px-4 py-2"
        )}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none dark:prose-invert text-brand-neutral-50 [&_*]:!text-sm [&_p]:!leading-6",
            isUser && "[&_p]:!my-0.5"
          )}
        >
          <Markdown text={markdown} />
        </div>
      </div>
      {links && links.length > 0 ? (
        <div className="mt-1 flex flex-row flex-wrap gap-2">
          {links.map((item, i) => (
            <Link
              key={i}
              href={item.url}
              className="group block text-xs rounded-xs border border-brand-neutral-200 bg-brand-black p-3 transition-all duration-200 hover:bg-white/5 hover:border-brand-neutral-100"
            >
              <p className="font-semibold text-brand-neutral-50 group-hover:text-brand-white transition-colors">
                {item.title}
              </p>
              <p className="text-brand-neutral-100 text-[10px] mt-0.5">
                Reference {item.label}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileList(props: Omit<ComponentProps<"div">, "dir">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "instant",
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      const viewport = element.firstElementChild!;

      element.style.setProperty(
        "--fd-animated-height",
        `${viewport.clientHeight}px`
      );
    });

    const viewport = element.firstElementChild;
    if (viewport) observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "overflow-hidden h-(--fd-animated-height) transition-[height]",
        props.className
      )}
    >
      <div
        ref={containerRef}
        className="sidebar-scrollbar overflow-y-auto min-w-0 flex flex-col max-h-[calc(100vh-200px)] p-4"
      >
        {props.children}
      </div>
    </div>
  );
}

function MobileDialog({
  open,
  onOpenChange,
  chat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: UseChatHelpers<UIMessage>;
}) {
  const hasMessages = chat.messages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 bg-brand-black/50" />
      <DialogContent
        aria-describedby={undefined}
        className="fixed bg-brand-black data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom bottom-0 left-0 right-0 z-50 grid w-full rounded-t-xs border-t border-x border-brand-neutral-200 duration-200 overflow-hidden"
      >
        <DialogTitle className="hidden">Ask AI</DialogTitle>

        {/* Messages list - grows upward */}
        {hasMessages && (
          <MobileList data-empty={!hasMessages}>
            <div className="flex flex-col gap-4">
              {chat.messages
                .filter((msg) => msg.role !== "system")
                .map((item) => (
                  <Message key={item.id} message={item} />
                ))}
            </div>
          </MobileList>
        )}

        {/* Input - always at the bottom */}
        <div
          className={cn(hasMessages ? "border-t border-brand-neutral-200" : "")}
        >
          <div className="flex flex-row items-center gap-2 p-4">
            <AskAIInput className="flex-1" />
          </div>
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            <AskAIActions alwaysShow />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DesktopDialog({
  open,
  onOpenChange,
  chat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: UseChatHelpers<UIMessage>;
}) {
  const hasMessages = chat.messages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 bg-brand-black/50" />
      <DialogContent
        aria-describedby={undefined}
        className="fixed bg-brand-black data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 top-[calc(50%-250px)] left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 rounded-xs border border-brand-neutral-200 duration-200 overflow-hidden"
      >
        <DialogTitle className="hidden">Ask AI</DialogTitle>

        {/* Messages list - only shown when there are messages */}
        {hasMessages && (
          <List data-empty={!hasMessages}>
            <div className="flex flex-col gap-4">
              {chat.messages
                .filter((msg) => msg.role !== "system")
                .map((item) => (
                  <Message key={item.id} message={item} />
                ))}
            </div>
          </List>
        )}

        {/* Input - always at the bottom */}
        <div
          className={cn(hasMessages ? "border-t border-brand-neutral-200" : "")}
        >
          <div className="flex flex-row items-center gap-2 p-4">
            <AskAIInput className="flex-1" />
          </div>
          {hasMessages && (
            <div className="flex items-center justify-end gap-2 px-4 pb-4">
              <AskAIActions />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface AskAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskAIDialog({ open, onOpenChange }: AskAIDialogProps) {
  const chat = useChat({
    id: "ask",
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      onOpenChange(false);
      e.preventDefault();
    }
  };

  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyPressRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <Context
      value={useMemo(
        () => ({ chat, open, setOpen: onOpenChange }),
        [chat, open, onOpenChange]
      )}
    >
      {isMobile ? (
        <MobileDialog open={open} onOpenChange={onOpenChange} chat={chat} />
      ) : (
        <DesktopDialog open={open} onOpenChange={onOpenChange} chat={chat} />
      )}
    </Context>
  );
}
