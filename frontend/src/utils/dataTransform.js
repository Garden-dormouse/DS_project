/**
 * Data transformation and aggregation utilities.
 * These functions are used to merge and process data from multiple sources.
 */

/**
 * Sort months in chronological order.
 * @param {string[]} months - Array of month strings (format: YYYY-MM)
 * @returns {string[]} Sorted array
 */
export function sortMonths(months) {
  return [...months].sort((a, b) => a.localeCompare(b));
}

/**
 * Filter months by a given range, handling edge cases.
 * If no range is specified, returns all months.
 * @param {string[]} availableMonths - All available months
 * @param {string|null} startMonth - Range start (inclusive)
 * @param {string|null} endMonth - Range end (inclusive)
 * @returns {string[]} Filtered months within range
 */
export function getMonthRange(availableMonths, startMonth, endMonth) {
  const sorted = sortMonths(availableMonths);
  if (!sorted.length) return [];

  if (!startMonth && !endMonth) return sorted;

  const safeStart = startMonth || endMonth;
  const safeEnd = endMonth || startMonth;

  if (!safeStart || !safeEnd) return sorted;

  const [from, to] =
    safeStart.localeCompare(safeEnd) <= 0
      ? [safeStart, safeEnd]
      : [safeEnd, safeStart];

  return sorted.filter((month) => month >= from && month <= to);
}

/**
 * Create a human-readable label for a month range.
 * @param {string[]} monthsInRange - Months in the selected range
 * @param {string[]} availableMonths - All available months
 * @returns {string} Formatted label
 */
export function formatRangeLabel(monthsInRange, availableMonths) {
  if (!monthsInRange.length) return "All Months";
  if (monthsInRange.length === availableMonths.length) return "All Months";
  if (monthsInRange.length === 1) return monthsInRange[0];
  return `${monthsInRange[0]} → ${monthsInRange[monthsInRange.length - 1]}`;
}

/**
 * Normalize various GeoJSON formats into a FeatureCollection.
 * @param {any} input - GeoJSON input (FeatureCollection, Feature, or Feature array)
 * @returns {FeatureCollection|null} Normalized FeatureCollection
 */
export function normalizeRangeFeatureCollection(input) {
  if (!input) return null;
  if (input.type === "FeatureCollection" && Array.isArray(input.features)) return input;
  if (input.type === "Feature") {
    return { type: "FeatureCollection", features: [input] };
  }
  if (Array.isArray(input)) {
    return { type: "FeatureCollection", features: input.filter(Boolean) };
  }
  return null;
}

/**
 * Merge multiple GeoJSON FeatureCollections into a single one.
 * Used for combining language ranges from multiple queries.
 * @param {FeatureCollection[]} ranges - Array of FeatureCollections
 * @returns {FeatureCollection|null} Merged FeatureCollection
 */
export function mergeLanguageRanges(ranges) {
  const features = ranges
    .map(normalizeRangeFeatureCollection)
    .filter(Boolean)
    .flatMap((fc) => fc.features || []);

  if (!features.length) return null;

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Merge timeseries data from multiple queries into aggregated monthly pageviews.
 * Handles different response formats and ensures all months have entries.
 * @param {Array[]} results - Array of timeseries response arrays
 * @param {string[]} months - Target months to include
 * @returns {Object[]} Array of {month, pageviews} objects sorted chronologically
 */
export function mergeTimeseriesResults(results, months) {
  const merged = new Map();

  // Initialize all months with 0
  for (const month of months || []) {
    merged.set(month, 0);
  }

  // Aggregate pageviews from all results
  for (const rows of results) {
    for (const row of Array.isArray(rows) ? rows : []) {
      const month = row.month;
      const value = Number(row.pageviews || 0);
      merged.set(month, (merged.get(month) || 0) + value);
    }
  }

  return Array.from(merged.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, pageviews]) => ({ month, pageviews }));
}

/**
 * Merge top species results from multiple queries, deduplicating by ID.
 * Keeps the entry with highest pageviews when duplicates exist.
 * @param {Array[]} results - Array of top species response arrays
 * @param {number} limit - Maximum number of species to return
 * @returns {Object[]} Top species sorted by pageviews (descending)
 */
export function mergeTopSpeciesResults(results, limit) {
  const speciesMap = new Map();

  for (const rows of results) {
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row.id != null) {
        const existing = speciesMap.get(row.id);
        if (!existing || row.pageviews > existing.pageviews) {
          speciesMap.set(row.id, row);
        }
      }
    }
  }

  return Array.from(speciesMap.values())
    .sort((a, b) => (b.pageviews || 0) - (a.pageviews || 0))
    .slice(0, limit);
}
