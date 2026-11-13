// Keep the supplied animation intact; card renderers may display its first frame.
export const DEFAULT_OG_IMAGE = {
  url: "/xmcp-chrome-og.gif",
  type: "image/gif",
  width: 480,
  height: 270,
  alt: "The chrome xmcp logo on a black background",
};

// A matching still gives Twitter cards a predictable preview without animation.
export const DEFAULT_TWITTER_IMAGE = {
  url: "/xmcp-chrome-og.png",
  width: 480,
  height: 270,
  alt: DEFAULT_OG_IMAGE.alt,
};
