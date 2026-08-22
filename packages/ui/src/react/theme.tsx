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
  background: "222.2 84% 4.9%",
  foreground: "210 40% 98%",
  card: "222.2 84% 4.9%",
  cardForeground: "210 40% 98%",
  border: "217.2 32.6% 17.5%",
  input: "217.2 32.6% 17.5%",
  muted: "217.2 32.6% 17.5%",
  mutedForeground: "215 20.2% 65.1%",
  primary: "210 40% 98%",
  primaryForeground: "222.2 47.4% 11.2%",
  secondary: "217.2 32.6% 17.5%",
  secondaryForeground: "210 40% 98%",
  destructive: "0 72% 51%",
  destructiveForeground: "210 40% 98%",
  accent: "217.2 32.6% 17.5%",
  accentForeground: "210 40% 98%",
  ring: "212.7 26.8% 83.9%",
  radius: "0.5rem",
};

const lightTokens: ThemeTokens = {
  background: "0 0% 100%",
  foreground: "222.2 84% 4.9%",
  card: "0 0% 100%",
  cardForeground: "222.2 84% 4.9%",
  border: "214.3 31.8% 91.4%",
  input: "214.3 31.8% 91.4%",
  muted: "210 40% 96.1%",
  mutedForeground: "215.4 16.3% 46.9%",
  primary: "222.2 47.4% 11.2%",
  primaryForeground: "210 40% 98%",
  secondary: "210 40% 96.1%",
  secondaryForeground: "222.2 47.4% 11.2%",
  destructive: "0 72% 51%",
  destructiveForeground: "210 40% 98%",
  accent: "210 40% 96.1%",
  accentForeground: "222.2 47.4% 11.2%",
  ring: "222.2 84% 4.9%",
  radius: "0.5rem",
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
