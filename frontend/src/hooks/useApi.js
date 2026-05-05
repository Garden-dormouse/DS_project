import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { CACHE_TIMES } from "../config/queryClient.js";

/**
 * Custom React Query hooks for all API calls.
 * Automatically handles caching (2min), deduplication, and state management.
 *
 * Caching strategy:
 * - STATIC queries (24hr): Species types, languages - rarely change
 * - MEDIUM queries (5min): Available months, language ranges - semi-stable
 * - DYNAMIC queries (2min, 15min gc): Species/timeseries - frequently changing
 *
 * Batch queries reuse the same cache keys as single queries, so selecting/deselecting
 * languages/species reuses cached data instead of refetching.
 */

// Static data (24 hours cache)
export const useSpeciesTypes = () =>
  useQuery({
    queryKey: ["speciesTypes"],
    queryFn: () => api.getSpeciesTypes(),
    ...CACHE_TIMES.STATIC,
  });

export const useLanguages = () =>
  useQuery({
    queryKey: ["languages"],
    queryFn: () => api.getLanguages(),
    ...CACHE_TIMES.STATIC,
  });

export const useSpecies = () =>
  useQuery({
    queryKey: ["species"],
    queryFn: () => api.getSpecies(),
    ...CACHE_TIMES.STATIC,
  });

// Medium-lived data (5 minutes cache)
export const useAvailableMonths = () =>
  useQuery({
    queryKey: ["months"],
    queryFn: () => api.getMonths(),
    ...CACHE_TIMES.MEDIUM,
  });

export const useLanguageRange = (languageCode) =>
  useQuery({
    queryKey: ["languageRange", languageCode],
    queryFn: () => api.getLanguageRange(languageCode),
    enabled: !!languageCode,
    ...CACHE_TIMES.MEDIUM,
  });

// Dynamic data (30 seconds cache)
export const useLanguagesMapData = (filters) =>
  useQuery({
    queryKey: [
      "mapData",
      filters?.startMonth,
      filters?.endMonth,
      filters?.speciesType,
      filters?.speciesId,
    ],
    queryFn: () => api.getLanguagesMapData(filters),
    enabled: !!(filters?.startMonth && filters?.endMonth),
    ...CACHE_TIMES.DYNAMIC,
  });

export const useTopSpeciesByLanguage = (languageCode, options) =>
  useQuery({
    queryKey: [
      "topSpecies",
      languageCode,
      options?.limit,
      options?.startMonth,
      options?.endMonth,
      options?.speciesType,
    ],
    queryFn: () => api.getTopSpeciesByLanguage(languageCode, options),
    enabled: !!languageCode,
    ...CACHE_TIMES.DYNAMIC,
  });

export const useTopLanguagesBySpecies = (options) =>
  useQuery({
    queryKey: [
      "topLanguages",
      options?.speciesId,
      options?.limit,
      options?.startMonth,
      options?.endMonth,
      options?.speciesType,
    ],
    queryFn: () => api.getTopLanguagesBySpecies(options),
    enabled: options?.speciesId != null,
    ...CACHE_TIMES.DYNAMIC,
  });

export const useTimeseries = (options) =>
  useQuery({
    queryKey: [
      "timeseries",
      options?.languageCode,
      options?.speciesId,
      options?.startMonth,
      options?.endMonth,
      options?.speciesType,
    ],
    queryFn: () => api.getTimeseries(options),
    enabled: !!options?.languageCode,
    ...CACHE_TIMES.DYNAMIC,
  });

/**
 * Batch query hooks using useQueries for parallel execution with individual caching.
 * 
 * These hooks execute multiple queries in parallel, each with its own cache key.
 * This enables fine-grained caching: when a user selects/deselects items,
 * previously cached queries are reused instead of refetched.
 */

// Fetch top species for multiple languages in parallel (each individually cached)
export const useTopSpeciesByLanguageBatch = (languageCodes = [], options = {}) => {
  return useQueries({
    queries: (languageCodes || []).map((languageCode) => ({
      queryKey: [
        "topSpecies",
        languageCode,
        options?.limit,
        options?.startMonth,
        options?.endMonth,
        options?.speciesType,
      ],
      queryFn: () => api.getTopSpeciesByLanguage(languageCode, options),
      enabled: !!languageCode,
      ...CACHE_TIMES.DYNAMIC,
    })),
  });
};

// Fetch language ranges for multiple languages in parallel (each individually cached)
export const useLanguageRangeBatch = (languageCodes = []) => {
  return useQueries({
    queries: (languageCodes || []).map((languageCode) => ({
      queryKey: ["languageRange", languageCode],
      queryFn: () => api.getLanguageRange(languageCode),
      enabled: !!languageCode,
      ...CACHE_TIMES.MEDIUM,
    })),
  });
};

// Fetch timeseries for multiple languages in parallel (each individually cached)
export const useTimeseriesBatch = (options = {}, languageCodes = []) => {
  return useQueries({
    queries: (languageCodes || []).map((languageCode) => ({
      queryKey: [
        "timeseries",
        languageCode,
        options?.speciesId,
        options?.startMonth,
        options?.endMonth,
        options?.speciesType,
      ],
      queryFn: () => api.getTimeseries({ ...options, languageCode }),
      enabled: !!languageCode,
      ...CACHE_TIMES.DYNAMIC,
    })),
  });
};

// Fetch timeseries for all species-language combinations in parallel.
export const useSpeciesLanguageTimeseriesBatch = (
  speciesIds = [],
  languageCodes = [],
  options = {}
) => {
  const descriptors = (speciesIds || [])
    .filter((speciesId) => speciesId != null)
    .flatMap((speciesId) =>
      (languageCodes || [])
        .filter(Boolean)
        .map((languageCode) => ({
          speciesId,
          languageCode,
          requestOptions: { ...options, speciesId, languageCode },
        }))
    );

  const results = useQueries({
    queries: descriptors.map(({ requestOptions, languageCode, speciesId }) => ({
      queryKey: [
        "timeseries",
        languageCode,
        speciesId,
        requestOptions?.startMonth,
        requestOptions?.endMonth,
        requestOptions?.speciesType,
      ],
      queryFn: () => api.getTimeseries(requestOptions),
      enabled: !!languageCode,
      ...CACHE_TIMES.DYNAMIC,
    })),
  });

  return results.map((result, idx) => ({
    ...result,
    speciesId: descriptors[idx]?.speciesId,
    languageCode: descriptors[idx]?.languageCode,
  }));
};
