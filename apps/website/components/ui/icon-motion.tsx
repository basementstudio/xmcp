"use client";

import {
  animate,
  useReducedMotion,
  type DOMKeyframesDefinition,
} from "framer-motion";
import { useEffect } from "react";

const CONTROL =
  'a[href], button, summary, [role="button"], [role="menuitem"], [role="option"]';
const ICON = "svg[data-icon]";
// Each gesture follows the glyph's meaning. Brand marks remain still.
const GESTURES: Record<string, DOMKeyframesDefinition> = {
  MagnifyingGlassIcon: { scale: [1, 1.16, 1.08] },
  CopyIcon: { scaleX: [1, 0.88, 1], rotate: [0, -6, 0] },
  CheckIcon: { scale: [1, 0.8, 1.12, 1] },
  CheckCircledIcon: { scale: [1, 0.9, 1.08, 1] },
  ReloadIcon: { rotate: 180 },
  UpdateIcon: { rotate: 180 },
  GearIcon: { rotate: 45 },
  SunIcon: { rotate: 45 },
  MoonIcon: { rotate: -18 },
  ArrowRightIcon: { x: 2 },
  ArrowLeftIcon: { x: -2 },
  ArrowTopRightIcon: { x: 1.5, y: -1.5 },
  ExternalLinkIcon: { scale: [1, 1.12, 1] },
  ChevronDownIcon: { scaleY: [1, 0.75, 1] },
  ChevronLeftIcon: { x: -2 },
  ChevronRightIcon: { x: 2 },
  HamburgerMenuIcon: { scaleX: [1, 0.8, 1] },
  Cross2Icon: { rotate: 90 },
  PaperPlaneIcon: { rotate: -12, x: 1.5 },
  TrashIcon: { rotate: [0, -10, 8, 0] },
  Link2Icon: { rotate: [0, -12, 0] },
  PlayIcon: { scale: [1, 1.15, 1.05] },
  DownloadIcon: { scaleY: [1, 0.8, 1] },
  GlobeIcon: { rotate: 30 },
  ClockIcon: { rotate: 30 },
  TimerIcon: { rotate: [0, -12, 12, 0] },
  CodeIcon: { scaleX: [1, 1.18, 1] },
  FileTextIcon: { scaleX: [1, 0.9, 1] },
  ArchiveIcon: { scaleY: [1, 0.9, 1] },
  ChatBubbleIcon: { scale: [1, 1.12, 1] },
  MagicWandIcon: { rotate: [0, -15, 0], scale: [1, 1.1, 1] },
  LightningBoltIcon: { scale: [1, 1.2, 0.95, 1] },
  LayersIcon: { scaleY: [1, 1.16, 1] },
  CardStackPlusIcon: { scaleY: [1, 1.16, 1] },
  BarChartIcon: { scaleY: [1, 0.65, 1] },
  ListBulletIcon: { scaleX: [1, 0.85, 1] },
  LockClosedIcon: { rotate: [0, -8, 8, 0] },
  ColorWheelIcon: { rotate: 60 },
  CubeIcon: { rotate: [0, 12, 0] },
  Component2Icon: { rotate: [0, 12, 0] },
  TokensIcon: { rotate: [0, 15, 0] },
  RocketIcon: { rotate: [0, -5, 5, 0], scale: [1, 1.12, 1] },
  HomeIcon: { scale: [1, 1.1, 1] },
  PersonIcon: { rotate: [0, -8, 0] },
  AvatarIcon: { rotate: [0, -8, 0] },
  GroupIcon: { scaleX: [1, 1.12, 1] },
  IdCardIcon: { rotate: [0, -6, 0] },
  InfoCircledIcon: { scale: [1, 1.1, 1] },
  ExclamationTriangleIcon: { rotate: [0, -6, 6, 0] },
  DotFilledIcon: { scale: [1, 1.2, 1] },
};
const REST = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 };
const GESTURE_SECONDS = 0.55;
const RETURN_SECONDS = 0.35;

export function IconMotion() {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const animations = new Map<Element, ReturnType<typeof animate>>();
    const animatedIcons = new Set<SVGElement>();
    let hovered: Element | null = null;
    let focused: Element | null = null;
    const controller = new AbortController();

    function control(target: EventTarget | null) {
      return target instanceof Element ? target.closest(CONTROL) : null;
    }
    function update(element: Element | null) {
      if (!element) return;
      const active =
        (element === hovered || element === focused) &&
        !element.matches(':disabled, [aria-disabled="true"], [data-disabled]');
      element.querySelectorAll<SVGElement>(ICON).forEach((icon) => {
        // Nested controls own their icons; don't animate an entire submenu.
        if (icon.closest(CONTROL) !== element) return;
        const gesture = GESTURES[icon.dataset.icon ?? ""];
        if (!gesture || icon.classList.contains("animate-spin")) return;
        animations.get(icon)?.stop();
        if (active) animatedIcons.add(icon);
        const animation = animate(icon, active ? gesture : REST, {
          duration: active ? GESTURE_SECONDS : RETURN_SECONDS,
          ease: [0.22, 1, 0.36, 1],
        });
        animations.set(icon, animation);
        void animation.then(() => {
          if (animations.get(icon) !== animation) return;
          animations.delete(icon);
          if (!active) {
            animatedIcons.delete(icon);
            icon.style.removeProperty("transform");
          }
        });
      });
    }
    function pointer(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      const next = control(
        event.type === "pointerout" ? event.relatedTarget : event.target
      );
      if (next === hovered) return;
      const previous = hovered;
      hovered = next;
      update(previous);
      update(hovered);
    }
    function focus(event: FocusEvent) {
      const next = control(
        event.type === "focusout" ? event.relatedTarget : event.target
      );
      const previous = focused;
      focused = next?.matches(":focus-visible") ? next : null;
      update(previous);
      update(focused);
    }
    // Delegation also covers server-rendered icons and portalled dialogs without
    // turning each icon into a client component or observing route mutations.
    const options = { signal: controller.signal };
    document.addEventListener("pointerover", pointer, options);
    document.addEventListener("pointerout", pointer, options);
    document.addEventListener("focusin", focus, options);
    document.addEventListener("focusout", focus, options);
    return () => {
      controller.abort();
      animations.forEach((animation) => animation.stop());
      animatedIcons.forEach((icon) => icon.style.removeProperty("transform"));
    };
  }, [reducedMotion]);
  return null;
}
