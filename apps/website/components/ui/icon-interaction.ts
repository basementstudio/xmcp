export interface IconAnimation {
  startAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
}

const CONTROL =
  'a[href], button, summary, [role="button"], [role="menuitem"], [role="option"]';

// Drive the upstream imperative handles from the whole hit area, including
// keyboard focus. Each icon belongs only to its nearest interactive control.
export function bindIconInteraction(
  icon: SVGSVGElement,
  animation: IconAnimation
) {
  const control = icon.closest(CONTROL);
  if (!control || icon.classList.contains("animate-spin")) {
    animation.resetAnimation();
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let hovered = false;
  let focused = false;
  let playing = false;
  const listeners = new AbortController();
  const update = () => {
    const active =
      !reducedMotion.matches &&
      (hovered || focused) &&
      !control.matches(':disabled, [aria-disabled="true"], [data-disabled]') &&
      icon.getBoundingClientRect().width > 0;
    if (active === playing) return;
    playing = active;
    if (active) animation.startAnimation();
    else animation.stopAnimation();
  };
  const enter = (event: Event) => {
    if ((event as PointerEvent).pointerType === "touch") return;
    hovered = true;
    update();
  };
  const leave = () => {
    hovered = false;
    update();
  };
  const focus = () => {
    focused = control.matches(":focus-visible");
    update();
  };
  const blur = () => {
    focused = false;
    update();
  };
  const preferenceChanged = () => {
    hovered = false;
    focused = false;
    playing = false;
    animation.resetAnimation();
  };
  const options = { signal: listeners.signal };
  reducedMotion.addEventListener("change", preferenceChanged, options);
  control.addEventListener("pointerenter", enter, options);
  control.addEventListener("pointerleave", leave, options);
  control.addEventListener("pointercancel", leave, options);
  control.addEventListener("focus", focus, options);
  control.addEventListener("blur", blur, options);
  return () => {
    listeners.abort();
    animation.resetAnimation();
  };
}
