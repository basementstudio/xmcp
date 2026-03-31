import React from "react";
import { useUiState } from "../../renderer/StateProvider.js";
import type { ImageProps } from "../../schema/types.js";
import { cn } from "../../react/utils.js";

export function Image({
  src,
  srcKey,
  alt,
  width,
  height,
  className,
}: ImageProps) {
  const stateValue = useUiState(srcKey ?? "");
  const resolvedSrc = srcKey ? (stateValue != null ? String(stateValue) : undefined) : src;

  if (!resolvedSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]",
          className,
        )}
        style={{ width, height }}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt ?? ""}
      width={width}
      height={height}
      className={cn(
        "rounded-[calc(var(--radius)-0.2rem)]",
        className,
      )}
    />
  );
}

export default Image;
