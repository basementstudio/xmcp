# Lucide Animated components

Source: [pqoqubbw/icons](https://github.com/pqoqubbw/icons) at
[`cf847c1f6ba0e1f0695e2ded6bf6d86df0a09232`](https://github.com/pqoqubbw/icons/tree/cf847c1f6ba0e1f0695e2ded6bf6d86df0a09232/icons).
See `LICENSE` for the upstream MIT notice.

Only icons used by the website are included. Import through `../site-icons.tsx`
to preserve sizing, parent-control interactions, and reduced-motion behavior.
The existing exported names keep consumers compatible during this migration.

Local adaptations:

- Use the existing `framer-motion` dependency and local `cn` helper.
- Put SVG attributes on the SVG itself instead of an enclosing div, preserving
  inline layout, theme selectors, and CSS state rotation.
- Default to 15px and expose `svgRef` to attach parent-control events.
- Add an immediate reset handle for reduced motion and unmount cleanup.
- Cancel subsequent stages of asynchronous animations after hover/focus ends.

The upstream SVG artwork, animation variants, and timing are preserved.
