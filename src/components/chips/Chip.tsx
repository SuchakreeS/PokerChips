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

/** Returns true if a hex fill is light enough to need dark ink on top. */
function isLightColor(hex: string): boolean {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  // Relative luminance (perceptual weighting).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function Chip({ value, color }: ChipProps) {
  const light = isLightColor(color);
  // Dark chips get a warm amber ring + ink (echoes the app's gold accent);
  // light chips get a dark slate ring + ink for contrast against the felt.
  const inkColor = light ? "#0F172A" : "#FDE68A";
  const ringColor = light ? "#0F172A" : "#FDE68A";

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label={`${value} chip`}>
      <circle cx="24" cy="24" r="22" fill={color} stroke="#0F172A" strokeWidth="2.5" />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke={ringColor}
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeLinecap="round"
        opacity={light ? 0.6 : 0.8}
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
