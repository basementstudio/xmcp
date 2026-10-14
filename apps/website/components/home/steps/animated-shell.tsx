"use client";

import { useEffect, useRef } from "react";

// Human input is slower than terminal output; pauses simulate reading and work.
const INPUT_CHARACTER_MS = 55;
const OUTPUT_CHARACTER_MS = 16;
const LINE_PAUSE_MS = 180;
const ANSWER_PAUSE_MS = 500;
const SELECTION_PAUSE_MS = 550;
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
  selection?: boolean;
  tone?: "success" | "command";
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
    const choices = Array.from(
      element.querySelectorAll<HTMLElement>("[data-shell-choice]")
    );
    const lines = Array.from(
      element.querySelectorAll<HTMLElement>("[data-shell-line]")
    );
    const events: { at: number; apply: () => void }[] = [];
    let time = PAUSES.prompt;
    let caret: HTMLElement | undefined;
    let selecting: HTMLElement | undefined;
    const moveCaret = (next?: HTMLElement) => {
      caret?.removeAttribute("data-shell-caret");
      caret = next;
      caret?.setAttribute("data-shell-caret", "");
    };
    const type = (container: Element | null, pace: number) => {
      container
        ?.querySelectorAll<HTMLElement>("[data-shell-character]")
        .forEach((character) => {
          events.push({
            at: time,
            apply: () => {
              character.style.opacity = "1";
              moveCaret(character);
            },
          });
          time += pace;
        });
    };
    const revealLine = (index: number) => {
      const line = lines[index];
      time += output[index].waitBefore
        ? PAUSES[output[index].waitBefore]
        : LINE_PAUSE_MS;
      const choice = line.querySelector<HTMLElement>("[data-shell-choice]");
      if (choice) {
        events.push({
          at: time,
          apply: () => {
            choice.style.opacity = "1";
          },
        });
      }
      type(line.querySelector("[data-shell-text]"), OUTPUT_CHARACTER_MS);
      if (output[index].answer) {
        time += ANSWER_PAUSE_MS;
        type(line.querySelector("[data-shell-answer]"), INPUT_CHARACTER_MS);
      }
      if (output[index].tone === "success") {
        time += PAUSES.prompt;
        type(line.querySelector("[data-shell-completion]"), MARK_CHARACTER_MS);
      }
    };

    type(element.querySelector("code"), INPUT_CHARACTER_MS);
    time += PAUSES.launch;
    for (let index = 0; index < lines.length; index++) {
      if (!output[index].selection) {
        revealLine(index);
        continue;
      }
      // Print the whole choice list before moving through it and checking items.
      const start = index;
      while (index < lines.length && output[index].selection) {
        revealLine(index);
        index++;
      }
      for (let choiceIndex = start; choiceIndex < index; choiceIndex++) {
        const line = lines[choiceIndex];
        const choice = line.querySelector<HTMLElement>("[data-shell-choice]")!;
        events.push({
          at: time,
          apply: () => {
            moveCaret();
            selecting?.removeAttribute("data-shell-selecting");
            selecting = line;
            line.setAttribute("data-shell-selecting", "");
          },
        });
        time += SELECTION_PAUSE_MS;
        events.push({
          at: time,
          apply: () => {
            choice.textContent = "◉";
            choice.dataset.shellChecked = "true";
          },
        });
        time += LINE_PAUSE_MS;
      }
      events.push({
        at: time,
        apply: () => {
          selecting?.removeAttribute("data-shell-selecting");
          selecting = undefined;
        },
      });
      index--;
    }

    characters.forEach((character) => {
      character.style.opacity = "0";
    });
    choices.forEach((choice) => {
      choice.textContent = "○";
      choice.dataset.shellChecked = "false";
      choice.style.opacity = "0";
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
      choices.forEach((choice) => {
        choice.textContent = "◉";
        choice.dataset.shellChecked = "true";
        choice.style.removeProperty("opacity");
      });
      moveCaret();
      selecting?.removeAttribute("data-shell-selecting");
    };
    // One clock drives all characters and choices, including wrapped lines.
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
    .map(
      (line) =>
        `${line.selection ? "  ◉ " : ""}${line.text}${line.answer ?? ""}`
    )
    .join("\n");

  return (
    // Keep the completed transcript available to screen readers and reserve its
    // exact layout while the decorative visual transcript types over time.
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
              {line.selection && (
                <>
                  {"  "}
                  <span data-shell-choice="" data-shell-checked="true">
                    ◉
                  </span>{" "}
                </>
              )}
              <span
                data-shell-text=""
                data-shell-prompt-text={
                  line.text.startsWith("? ") ? "" : undefined
                }
              >
                <Characters text={line.text} />
              </span>
              {line.answer && (
                <span data-shell-answer="">
                  <Characters text={line.answer} />
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
