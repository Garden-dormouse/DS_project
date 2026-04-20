import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep defaults conservative and use per-query presets for long-lived data.
      staleTime: 0,
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Cache time presets for different query types
export const CACHE_TIMES = {
  // Static data: species types, language list
  STATIC: {
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
  },
  // Medium-lived data: available months, language ranges
  MEDIUM: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },
  // Dynamic data: top species, timeseries, map data
  DYNAMIC: {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  },
};
