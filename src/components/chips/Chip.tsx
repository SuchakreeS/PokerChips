interface ChipProps {
  value: number;
  color: string;
}

/**
 * Denomination -> color mapping for poker chips.
 *
 * Palette chosen via the `ui-ux-pro-max` skill (Card & Board Game palette:
 * felt green + gold on dark, `#15803D`/`#166534` primary, `#D97706` accent)
 * cross-referenced against this app's established visual language (dark
 * emerald felt table, slate chrome, amber/gold accents for pot & CTAs).
 * Colors are chosen to read clearly against the emerald-700/800 table felt
 * and against slate-900/800 panel backgrounds, and to echo classic
 * real-world chip denomination colors (white/red/blue/black/purple/gold)
 * where they don't clash with the felt green.
 */
export const CHIP_DENOMINATION_COLORS: Record<number, string> = {
  1: "#F8FAFC", // slate-50 (white chip)
  5: "#DC2626", // red-600
  25: "#0284C7", // sky-600 (blue, avoids blending into the emerald felt)
  100: "#0F172A", // slate-900 (black chip)
  500: "#7C3AED", // violet-600 (purple)
  1000: "#D97706", // amber-600 (gold, echoes the app's pot/CTA accent)
};

// Two fixed ink candidates. Whichever wins the WCAG contrast check against
// a given chip fill is used for both the value text and the dashed ring, so
// every denomination gets a guaranteed-legible, non-hardcoded pairing.
const INK_WHITE = "#FFFFFF";
const INK_DARK = "#020617"; // slate-950 — close to near-black without being pure #000

/** WCAG relative luminance of a 6-digit hex color (0..1). */
function relativeLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  const channel = (start: number) => {
    const c = parseInt(normalized.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(0);
  const g = channel(2);
  const b = channel(4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio (1..21) between two hex colors. */
function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks whichever of the two ink candidates has higher contrast against the
 * given fill color. This is computed per-color (not a light/dark threshold
 * guess) so it holds for every entry in CHIP_DENOMINATION_COLORS as well as
 * any arbitrary color a caller passes in.
 */
function pickInkColor(fill: string): string {
  return contrastRatio(fill, INK_WHITE) >= contrastRatio(fill, INK_DARK) ? INK_WHITE : INK_DARK;
}

export function Chip({ value, color }: ChipProps) {
  const inkColor = pickInkColor(color);

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label={`${value} chip`}>
      <circle cx="24" cy="24" r="22" fill={color} stroke="#0F172A" strokeWidth="2.5" />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke={inkColor}
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeLinecap="round"
        opacity={0.7}
      />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill={inkColor}
      >
        {value}
      </text>
    </svg>
  );
}
