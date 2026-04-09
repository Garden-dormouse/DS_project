/**
 * API service for fetching data from the backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = {
  async getSpecies() {
    const response = await fetch(`${API_BASE_URL}/species`);
    if (!response.ok) throw new Error("Failed to fetch species");
    return response.json();
  },

  async getSpeciesTypes() {
    const response = await fetch(`${API_BASE_URL}/species/types`);
    if (!response.ok) throw new Error("Failed to fetch species types");
    return response.json();
  },

  async getLanguages() {
    const response = await fetch(`${API_BASE_URL}/languages`);
    if (!response.ok) throw new Error("Failed to fetch languages");
    return response.json();
  },

  async getLanguagesMapData(filters = {}) {
    const params = new URLSearchParams();

    if (filters.startMonth) params.append("start_month", filters.startMonth);
    if (filters.endMonth) params.append("end_month", filters.endMonth);
    if (filters.speciesType) params.append("species_type", filters.speciesType);
    if (filters.speciesId != null) params.append("species_id", filters.speciesId);

    const response = await fetch(`${API_BASE_URL}/languages/map-data?${params}`);
    if (!response.ok) throw new Error("Failed to fetch language map data");
    return response.json();
  },

  async getMonths() {
    const response = await fetch(`${API_BASE_URL}/timestamps/months`);
    if (!response.ok) throw new Error("Failed to fetch available months");
    return response.json();
  },

  async getLanguageRange(languageCode) {
    const response = await fetch(
      `${API_BASE_URL}/languages/${encodeURIComponent(languageCode)}/range`
    );
    if (!response.ok) return { type: "FeatureCollection", features: [] };
    return response.json();
  },

  async getTopSpeciesByLanguage(languageCode, options = {}) {
    const params = new URLSearchParams();
    params.append("language_code", languageCode);

    if (options.limit) params.append("limit", options.limit);
    if (options.startMonth) params.append("start_month", options.startMonth);
    if (options.endMonth) params.append("end_month", options.endMonth);
    if (options.speciesType) params.append("species_type", options.speciesType);

    const response = await fetch(`${API_BASE_URL}/pageviews/top-species?${params}`);
    if (!response.ok) throw new Error("Failed to fetch top species");
    return response.json();
  },

  async getTopLanguagesBySpecies(options = {}) {
    const params = new URLSearchParams();

    if (options.speciesId != null) params.append("species_id", options.speciesId);
    if (options.limit) params.append("limit", options.limit);
    if (options.startMonth) params.append("start_month", options.startMonth);
    if (options.endMonth) params.append("end_month", options.endMonth);
    if (options.speciesType) params.append("species_type", options.speciesType);

    const response = await fetch(`${API_BASE_URL}/pageviews/top-languages?${params}`);
    if (!response.ok) throw new Error("Failed to fetch top languages");
    return response.json();
  },

  async getTimeseries(options = {}) {
    const params = new URLSearchParams();

    if (options.languageCode) params.append("language_code", options.languageCode);
    if (options.speciesId != null) params.append("species_id", options.speciesId);
    if (options.startMonth) params.append("start_month", options.startMonth);
    if (options.endMonth) params.append("end_month", options.endMonth);
    if (options.speciesType) params.append("species_type", options.speciesType);

    const response = await fetch(`${API_BASE_URL}/pageviews/timeseries?${params}`);
    if (!response.ok) throw new Error("Failed to fetch timeseries");
    return response.json();
  },
};