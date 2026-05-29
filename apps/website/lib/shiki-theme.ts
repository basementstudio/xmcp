import ayuDark from "@shikijs/themes/ayu-dark";

const COLOR_REPLACEMENTS: Record<string, string> = {
  "#aad94c": "#A8EB7C",
  "#ff8f40": "#EC9D00",
  "#ffb454": "#EC9D00",
};

function replaceColor(value?: string) {
  if (!value) return value;
  return COLOR_REPLACEMENTS[value.toLowerCase()] ?? value;
}

export const XMCP_SHIKI_THEME_NAME = "xmcp-ayu-dark";

export const xmcpAyuDarkTheme = {
  ...ayuDark,
  name: XMCP_SHIKI_THEME_NAME,
  tokenColors: (ayuDark.tokenColors ?? []).map((rule) => ({
    ...rule,
    settings: rule.settings
      ? {
          ...rule.settings,
          foreground: replaceColor(rule.settings.foreground),
        }
      : rule.settings,
  })),
};
