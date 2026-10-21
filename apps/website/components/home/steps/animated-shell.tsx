"use client";

import { useEffect, useRef } from "react";

// Mirrors an inquirer session: only what a person types is written out.
// Output and picked answers appear a line at once, list prompts show their
// choices while the pointer moves, then collapse to the answer, as in a real
// terminal. Pauses simulate reading and work.
const INPUT_CHARACTER_MS = 55;
const LINE_PAUSE_MS = 180;
const ANSWER_PAUSE_MS = 500;
const POINTER_PAUSE_MS = 320;
// The wordmark prints as a quick terminal flourish after the success message.
const MARK_CHARACTER_MS = 4;
const PAUSES = { launch: 750, prompt: 400, work: 1800 } as const;

// Supplied xmcp wordmark, with its outer whitespace trimmed.
const XMCP_MARK = String.raw` ░░▓██▓░░   ░▓▓░░█▓░░
░▓█▓▒████▒░░▓█████▓░ ░░     ░░     ░░         ░░░       ░░░
▒▒░  ░████▒▒▒▓▓█▓▒  ░▓█▒   ░▓▓▒░ ░░▓▓▒      ░▒▓▓▒     ░▒▓██▓░░
      ░█████▒▒░   ░▒▓███▓▒▒▓███▓▒▒▓███▓░ ░▓██▓████▒░▒▓██░▒███▒░
   ░▒▒▒▓████▒▒▒▒▒   ▒███▓░░▒███▓░░▒███▓░▒███▓░▒▓█▓░ ▒███░ ▒███░
 ░▒████████████▓░   ▒███▓░ ▒███▒░░▒███▓░▒███▓  ░▒▓  ▒███░ ▒███░
        ▒████▓░     ▒███▓░ ▒███▒░░▒███▓ ▒███▓       ▒███░ ▒███░
     ░░▒▒░░████▒░   ▒███▓░ ▒███▒░░▒███▓ ▒███▓  ░░░▒ ▒███▓▒▓██▒░
  ░░░▓▓░░  ░▓████░░░▒███▓░░▒███▓░░▒███▓░░████▒░▓▓▒  ▒███░ ░░
 ░▒██████▒░▒░▓████▒▓▓▓██▓▒▒▓▓█▓▓▒░▓▓█▓▓▒ ░▒▓███▒░  ░▓███▒░░
░████▓▓███▒░ ░▓█▒░░░ ░░░    ░░░░   ░░░      ░░░░   ░░░░░░░░
░▓█▓░ ░▒▒░    ░░
 ░▒█▓`;

export type ShellLine = {
  text: string;
  answer?: string;
  /** The answer is typed, like a project name, rather than picked from a list. */
  typed?: boolean;
  /** Shown where the answer goes until it is given, e.g. a default. */
  hint?: string;
  /** Choices listed below the prompt while answering. */
  choices?: string[];
  /** Index the pointer moves to before the answer is accepted. */
  pick?: number;
  /** Checkbox list; every choice starts checked. */
  checkbox?: boolean;
  /** Spinner text shown in place of the line while it is pending. */
  pending?: string;
  tone?: "success" | "command" | "path";
  waitBefore?: keyof typeof PAUSES;
};

function Characters({ text }: { text: string }) {
  return Array.from(text).map((character, index) => (
    <span
      key={index}
      data-shell-character=""
      data-shell-check={character === "✔" ? "" : undefined}
      data-shell-prompt={index === 0 && text.startsWith("? ") ? "" : undefined}
    >
      {character}
    </span>
  ));
}

const open = (element: Element | null | undefined, value: boolean) =>
  element?.toggleAttribute("data-shell-open", value);

export function AnimatedShell({
  command,
  output,
}: {
  command: string;
  output: readonly ShellLine[];
}) {
  const transcript = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const element = transcript.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const characters = Array.from(
      element.querySelectorAll<HTMLElement>("[data-shell-character]")
    );
    const overlays = Array.from(
      element.querySelectorAll<HTMLElement>("[data-shell-overlay]")
    );
    const lines = Array.from(
      element.querySelectorAll<HTMLElement>("[data-shell-line]")
    );
    const events: { at: number; apply: () => void }[] = [];
    let time = PAUSES.prompt;
    let caret: HTMLElement | undefined;
    const at = (apply: () => void) => events.push({ at: time, apply });
    const moveCaret = (next?: HTMLElement) => {
      caret?.removeAttribute("data-shell-caret");
      caret = next;
      caret?.setAttribute("data-shell-caret", "");
    };
    const characterList = (container: Element | null) =>
      Array.from(
        container?.querySelectorAll<HTMLElement>("[data-shell-character]") ?? []
      );
    const type = (container: Element | null, pace: number) => {
      characterList(container).forEach((character) => {
        at(() => {
          character.style.opacity = "1";
          moveCaret(character);
        });
        time += pace;
      });
    };
    const show = (container: Element | null) => {
      const shown = characterList(container);
      if (!shown.length) return;
      at(() => {
        shown.forEach((character) => (character.style.opacity = "1"));
        moveCaret(shown.at(-1));
      });
    };

    const revealLine = (index: number) => {
      const line = lines[index];
      const spec = output[index];
      const pending = line.querySelector("[data-shell-pending]");
      if (pending) at(() => open(pending, true));
      time += spec.waitBefore ? PAUSES[spec.waitBefore] : LINE_PAUSE_MS;
      if (pending) at(() => open(pending, false));
      show(line.querySelector("[data-shell-text]"));
      if (!spec.answer) return;

      const hint = line.querySelector("[data-shell-hint]");
      const menu = line.querySelector("[data-shell-menu]");
      const options = Array.from(
        line.querySelectorAll<HTMLElement>("[data-shell-option]")
      );
      const point = (option: number) =>
        options.forEach((item, i) =>
          item.toggleAttribute("data-shell-active", i === option)
        );
      at(() => {
        open(hint, true);
        if (menu) {
          open(menu, true);
          point(0);
          moveCaret();
        }
      });
      if (hint || menu || spec.typed) time += ANSWER_PAUSE_MS;
      for (let option = 1; option <= (spec.pick ?? 0); option++) {
        at(() => point(option));
        time += POINTER_PAUSE_MS;
      }
      // Accepting a list answer collapses its choices, as inquirer does.
      at(() => {
        open(hint, false);
        open(menu, false);
      });
      const answer = line.querySelector("[data-shell-answer]");
      if (spec.typed) type(answer, INPUT_CHARACTER_MS);
      else show(answer);
    };

    type(element.querySelector("code"), INPUT_CHARACTER_MS);
    time += PAUSES.launch;
    output.forEach((spec, index) => {
      revealLine(index);
      if (spec.tone === "success") {
        time += PAUSES.prompt;
        type(
          lines[index].querySelector("[data-shell-completion]"),
          MARK_CHARACTER_MS
        );
      }
    });

    characters.forEach((character) => {
      character.style.opacity = "0";
    });
    element.dataset.shellState = "paused";
    let visible = false;
    let finished = false;
    let frame: number | undefined;
    let previousFrame: number | undefined;
    let elapsed = 0;
    let eventIndex = 0;
    const details = element.closest("details");
    const listeners = new AbortController();

    const stop = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      previousFrame = undefined;
    };
    const showTranscript = () => {
      characters.forEach((character) => {
        character.style.removeProperty("opacity");
      });
      overlays.forEach((overlay) => open(overlay, false));
      moveCaret();
    };
    // One clock drives all characters and menus, including wrapped lines.
    // Pausing discards wall-clock time so a hidden demo never skips ahead.
    const tick = (now: number) => {
      if (previousFrame !== undefined) elapsed += now - previousFrame;
      previousFrame = now;
      while (eventIndex < events.length && events[eventIndex].at <= elapsed) {
        events[eventIndex++].apply();
      }
      if (eventIndex === events.length) {
        finished = true;
        stop();
        showTranscript();
        element.dataset.shellState = "complete";
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    const update = () => {
      if (finished) return;
      if (motion.matches) {
        finished = true;
        stop();
        showTranscript();
        element.dataset.shellState = "static";
        return;
      }
      const active = visible && !document.hidden && (!details || details.open);
      if (active && frame === undefined) frame = requestAnimationFrame(tick);
      else if (!active) stop();
      element.dataset.shellState = active ? "running" : "paused";
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    motion.addEventListener("change", update, { signal: listeners.signal });
    document.addEventListener("visibilitychange", update, {
      signal: listeners.signal,
    });
    details?.addEventListener("toggle", update, { signal: listeners.signal });

    return () => {
      observer.disconnect();
      listeners.abort();
      stop();
      showTranscript();
    };
  }, [command, output]);

  const fullOutput = output
    .map((line) => `${line.text}${line.answer ?? ""}`)
    .join("\n");

  return (
    // Keep the completed transcript available to screen readers and reserve its
    // exact layout while the decorative visual transcript types over time.
    // Hints, menus and spinners are overlays, so opening them never moves text:
    // they cover lines that have not been printed yet.
    <pre ref={transcript} data-shell-demo="">
      <span className="sr-only">{`${command}\n\n${fullOutput}\n\nxmcp — ready.`}</span>
      <span aria-hidden="true">
        <code>
          <Characters text={command} />
        </code>
        {"\n\n"}
        <span className="text-brand-neutral-100">
          {output.map((line, index) => (
            <span key={index} data-shell-line="" data-shell-tone={line.tone}>
              {line.pending && (
                <span data-shell-overlay="" data-shell-pending="">
                  ⠋ {line.pending}
                </span>
              )}
              <span
                data-shell-text=""
                data-shell-prompt-text={
                  line.text.startsWith("? ") ? "" : undefined
                }
              >
                <Characters text={line.text} />
              </span>
              {line.hint && (
                <span data-shell-overlay="" data-shell-hint="">
                  {line.hint}
                </span>
              )}
              {line.answer && (
                <span data-shell-answer="">
                  <Characters text={line.answer} />
                </span>
              )}
              {line.choices && (
                <span data-shell-overlay="" data-shell-menu="">
                  {line.choices.map((choice) => (
                    <span key={choice} data-shell-option="">
                      <span data-shell-pointer="">❯</span>
                      {line.checkbox ? "◉ " : " "}
                      {choice}
                      {"\n"}
                    </span>
                  ))}
                </span>
              )}
              {"\n"}
              {line.tone === "success" && (
                <span data-shell-completion="">
                  {"\n"}
                  <Characters text={XMCP_MARK} />
                </span>
              )}
            </span>
          ))}
        </span>
      </span>
    </pre>
  );
}
