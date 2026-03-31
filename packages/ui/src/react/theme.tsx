import * as React from "react";
import type { CSSProperties } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  destructive: string;
  destructiveForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
  radius: string;
}

export interface ThemeDefinition {
  mode: ThemeMode;
  tokens: ThemeTokens;
  style: CSSProperties;
}

const darkTokens: ThemeTokens = {
  background: "222 47% 11%",
  foreground: "210 40% 98%",
  card: "224 44% 13%",
  cardForeground: "210 40% 98%",
  border: "217 33% 24%",
  input: "217 33% 24%",
  muted: "222 28% 18%",
  mutedForeground: "215 20% 65%",
  primary: "199 89% 58%",
  primaryForeground: "222 47% 11%",
  secondary: "217 33% 22%",
  secondaryForeground: "210 40% 98%",
  destructive: "0 72% 51%",
  destructiveForeground: "210 40% 98%",
  accent: "262 83% 66%",
  accentForeground: "210 40% 98%",
  ring: "199 89% 58%",
  radius: "0.9rem",
};

const lightTokens: ThemeTokens = {
  background: "0 0% 100%",
  foreground: "222 47% 11%",
  card: "210 40% 98%",
  cardForeground: "222 47% 11%",
  border: "214 32% 91%",
  input: "214 32% 91%",
  muted: "210 40% 96%",
  mutedForeground: "215 16% 47%",
  primary: "222 47% 11%",
  primaryForeground: "210 40% 98%",
  secondary: "210 40% 96%",
  secondaryForeground: "222 47% 11%",
  destructive: "0 72% 51%",
  destructiveForeground: "210 40% 98%",
  accent: "262 83% 54%",
  accentForeground: "210 40% 98%",
  ring: "222 47% 11%",
  radius: "0.9rem",
};

const themeContext = React.createContext<ThemeDefinition | null>(null);

const tokenVarMap: Record<keyof ThemeTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  border: "--border",
  input: "--input",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  ring: "--ring",
  radius: "--radius",
};

export const defaultDarkTheme = darkTokens;
export const defaultLightTheme = lightTokens;

export const uiShellClassName =
  "min-h-screen bg-[hsl(var(--background))] font-sans text-[hsl(var(--foreground))] antialiased";

function tokensToStyle(tokens: ThemeTokens): CSSProperties {
  const style: Record<string, string> = {};

  for (const tokenKey of Object.keys(tokenVarMap) as Array<keyof ThemeTokens>) {
    style[tokenVarMap[tokenKey]] = tokens[tokenKey];
  }

  return style as CSSProperties;
}

function getThemePreset(mode: ThemeMode): ThemeTokens {
  return mode === "light" ? defaultLightTheme : defaultDarkTheme;
}

export function createTheme(
  mode: ThemeMode = "dark",
  tokenOverrides: Partial<ThemeTokens> = {},
): ThemeDefinition {
  const tokens: ThemeTokens = {
    ...getThemePreset(mode),
    ...tokenOverrides,
  };

  return {
    mode,
    tokens,
    style: tokensToStyle(tokens),
  };
}

export function getThemeStyle(
  mode: ThemeMode = "dark",
  tokenOverrides: Partial<ThemeTokens> = {},
): CSSProperties {
  return createTheme(mode, tokenOverrides).style;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  mode?: ThemeMode;
  themeTokens?: Partial<ThemeTokens>;
}

export function ThemeProvider({
  children,
  mode = "dark",
  themeTokens,
}: ThemeProviderProps) {
  const value = React.useMemo(
    () => createTheme(mode, themeTokens),
    [mode, themeTokens],
  );

  return (
    <themeContext.Provider value={value}>{children}</themeContext.Provider>
  );
}

export function useTheme(): ThemeDefinition {
  const context = React.useContext(themeContext);
  return context ?? createTheme("dark");
}
