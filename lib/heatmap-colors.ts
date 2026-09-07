// lib/heatmap-colors.ts

// Darkest (lowest non-zero minutes) to brightest (highest minutes).
const HEATMAP_SCALE = [
  "#4A2F14",
  "#6D4620",
  "#8A5A19",
  "#C48024",
  "#F0A828",
  "#FFCB4D",
];

/**
 * Returns a background color for a heatmap cell, scaled relative to the
 * other values passed in `allMinutes`. The lowest value greater than 0
 * gets the darkest brown, the highest gets the brightest yellow.
 * Returns "" for 0 (caller should fall back to the neutral empty color).
 */
export function getHeatmapCellColor(minutes: number, allMinutes: number[]): string {
  if (!minutes || minutes <= 0) return "";

  const positives = allMinutes.filter((m) => m > 0);
  if (positives.length === 0) return "";

  const min = Math.min(...positives);
  const max = Math.max(...positives);

  if (min === max) return HEATMAP_SCALE[HEATMAP_SCALE.length - 1];

  const ratio = (minutes - min) / (max - min);
  const idx = Math.round(ratio * (HEATMAP_SCALE.length - 1));
  return HEATMAP_SCALE[idx];
}