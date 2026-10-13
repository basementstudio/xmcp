const ROMAN_DIGITS = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
] as const;

export function romanVersion(version: string): string {
  return version.replace(/^\d+\.\d+\.\d+/, (core) =>
    core
      .split(".")
      .map((part) => {
        let value = Number(part);
        // N (nulla) represents a zero semver segment; keep unusually large
        // versions numeric rather than rendering an unbounded string of Ms.
        if (value === 0) return "N";
        if (value > 3999) return part;
        let result = "";
        for (const [amount, glyph] of ROMAN_DIGITS) {
          while (value >= amount) {
            result += glyph;
            value -= amount;
          }
        }
        return result;
      })
      .join(".")
  );
}
