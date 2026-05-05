/**
 * Shared constants and configuration values across the app.
 * This file centralizes commonly used constants to avoid duplication.
 */

export const TYPE_COLORS = {
  mammal: "#60A5FA",
  bird: "#34D399",
  reptile: "#F59E0B",
};

export const PAGE_SIZE = 50;

/**
 * Get the color associated with a species type.
 * @param {string|null} speciesType - The species type (mammal, bird, reptile, etc.)
 * @param {string} fallback - Fallback color if type not found
 * @returns {string} Hex color code
 */
export function getTypeColor(speciesType, fallback = "#60A5FA") {
  return TYPE_COLORS[speciesType] || fallback;
}
