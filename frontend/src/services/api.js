/**
 * API service for fetching data from the backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  async getSpecies() {
    const response = await fetch(`${API_BASE_URL}/species`);
    if (!response.ok) throw new Error('Failed to fetch species');
    return response.json();
  },

  async getLanguages() {
    const response = await fetch(`${API_BASE_URL}/languages`);
    if (!response.ok) throw new Error('Failed to fetch languages');
    return response.json();
  },

  // async getTimeseries(filters = {}) {
  //   const params = new URLSearchParams();
  //   if (filters.speciesId) params.append('species_id', filters.speciesId);
  //   if (filters.languageCodes) params.append('language_codes', filters.languageCodes.join(','));
  //   if (filters.startDate) params.append('start_date', filters.startDate);
  //   if (filters.endDate) params.append('end_date', filters.endDate);

  //   const response = await fetch(`${API_BASE_URL}/pageviews/timeseries?${params}`);
  //   if (!response.ok) throw new Error('Failed to fetch timeseries');
  //   return response.json();
  // },

  // async getPageviewsByCountry(filters = {}) {
  //   const params = new URLSearchParams();
  //   if (filters.speciesId) params.append('species_id', filters.speciesId);
  //   if (filters.languageCodes) params.append('language_codes', filters.languageCodes.join(','));
  //   if (filters.startDate) params.append('start_date', filters.startDate);
  //   if (filters.endDate) params.append('end_date', filters.endDate);

  //   const response = await fetch(`${API_BASE_URL}/pageviews/country?${params}`);
  //   if (!response.ok) throw new Error('Failed to fetch pageviews by country');
  //   return response.json();
  // },

  async getLanguagesMapData(filters = {}) {
    const params = new URLSearchParams();
    // Only send month parameter if specified
    if (filters.month) params.append('month', filters.month);

    const response = await fetch(`${API_BASE_URL}/languages/map-data?${params}`);
    if (!response.ok) throw new Error('Failed to fetch language map data');
    return response.json();
  },

  async getMonths() {
    // Get list of available months from the database
    const response = await fetch(`${API_BASE_URL}/timestamps/months`);
    if (!response.ok) throw new Error('Failed to fetch available months');
    return response.json();
  },

  async getLanguageCountries(languageCode) {
    // Get all countries where a language is spoken
    const response = await fetch(`${API_BASE_URL}/languages/${languageCode}/countries`);
    if (!response.ok) throw new Error('Failed to fetch language countries');
    return response.json();
  },

  async getTopSpeciesByLanguage(languageCode, options = {}) {
    const params = new URLSearchParams();
    params.append('language_code', languageCode);
    if (options.limit) params.append('limit', options.limit);

    const response = await fetch(`${API_BASE_URL}/pageviews/top-species?${params}`);
    if (!response.ok) throw new Error('Failed to fetch top species');
    return response.json();
  }
};
