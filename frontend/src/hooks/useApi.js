import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { CACHE_TIMES } from "../config/queryClient.js";

/**
 * Custom React Query hooks for all API calls
 * Automatically handles caching, deduplication, and state management
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
    queryKey: ["mapData", filters],
    queryFn: () => api.getLanguagesMapData(filters),
    enabled: !!(filters?.startMonth || filters?.endMonth),
    ...CACHE_TIMES.DYNAMIC,
  });

export const useTopSpeciesByLanguage = (languageCode, options) =>
  useQuery({
    queryKey: ["topSpecies", languageCode, options],
    queryFn: () => api.getTopSpeciesByLanguage(languageCode, options),
    enabled: !!languageCode,
    ...CACHE_TIMES.DYNAMIC,
  });

export const useTopLanguagesBySpecies = (options) =>
  useQuery({
    queryKey: ["topLanguages", options],
    queryFn: () => api.getTopLanguagesBySpecies(options),
    enabled: options?.speciesId != null,
    ...CACHE_TIMES.DYNAMIC,
  });

export const useTimeseries = (options) =>
  useQuery({
    queryKey: ["timeseries", options],
    queryFn: () => api.getTimeseries(options),
    enabled: !!options?.languageCode,
    ...CACHE_TIMES.DYNAMIC,
  });

/**
 * Batch query hooks using useQueries for parallel execution with individual caching
 */

// Fetch top species for multiple languages in parallel (each individually cached)
export const useTopSpeciesByLanguageBatch = (languageCodes = [], options = {}) => {
  return useQueries({
    queries: (languageCodes || []).map((languageCode) => ({
      queryKey: ["topSpecies", languageCode, options],
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
      queryKey: ["timeseries", { ...options, languageCode }],
      queryFn: () => api.getTimeseries({ ...options, languageCode }),
      enabled: !!languageCode,
      ...CACHE_TIMES.DYNAMIC,
    })),
  });
};
