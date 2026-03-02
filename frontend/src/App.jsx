import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";

import { api } from "./services/api.js";

export default function App() {
  // ---- Global dashboard state (frontend-only) ----
  const [selectedIso3, setSelectedIso3] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null); // Language code like "en", "fi"
  const [highlightedCountries, setHighlightedCountries] = useState([]); // ISO3 codes to highlight
  const [selectedMonth, setSelectedMonth] = useState(null); // "2024-01" or null for "all months"
  const [languages, setLanguages] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [languagesData, monthsData] = await Promise.all([
          api.getLanguages(),
          api.getMonths()
        ]);
        setLanguages(languagesData);
        setAvailableMonths(monthsData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ---- Fetch real data from API ----
  const [mapIntensityByIso3, setMapIntensityByIso3] = useState({});
  const [topSpecies, setTopSpecies] = useState([]);

  // Load map data (all languages)
  useEffect(() => {
    async function fetchMapData() {
      try {
        const filters = selectedMonth 
          ? { month: selectedMonth }  // Show specific month
          : {};  // Show all data
        
        const mapData = await api.getLanguagesMapData(filters);
        setMapIntensityByIso3(mapData);
      } catch (err) {
        console.error('Error fetching map data:', err);
      }
    }
    fetchMapData();
  }, [selectedMonth]);

  // Load top species when a language is selected
  useEffect(() => {
    if (!selectedLanguage) {
      setTopSpecies([]);
      setHighlightedCountries([]);
      return;
    }
    
    async function fetchLanguageData() {
      try {
        // Fetch both top species and countries for this language
        const [topSpeciesData, countries] = await Promise.all([
          api.getTopSpeciesByLanguage(selectedLanguage, { limit: 20 }),
          api.getLanguageCountries(selectedLanguage)
        ]);
        
        setTopSpecies(topSpeciesData);
        setHighlightedCountries(countries);
        console.log(`Language '${selectedLanguage}' is spoken in:`, countries);
      } catch (err) {
        console.error('Error fetching language data:', err);
      }
    }
    fetchLanguageData();
  }, [selectedLanguage]);

  // Build reverse mapping: ISO3 -> language (for click handling)
  const iso3ToLanguage = useMemo(() => {
    const mapping = {
      "USA": "en", "GBR": "en", "CAN": "en", "AUS": "en",
      "FIN": "fi", 
      "SWE": "sv",
      "FRA": "fr", "BEL": "fr",
      "DEU": "de", "AUT": "de", "CHE": "de",
      "ESP": "es", "MEX": "es", "ARG": "es",
      "CHN": "zh",
      "JPN": "ja",
      "PRT": "pt", "BRA": "pt",
      "ITA": "it",
      "RUS": "ru",
      "SAU": "ar", "EGY": "ar",
      "NLD": "nl",
      "POL": "pl",
      "TUR": "tr",
      "KOR": "ko",
    };
    return mapping;
  }, []);

  const handleCountryClick = (iso3) => {
    setSelectedIso3(iso3);
    const langCode = iso3ToLanguage[iso3];
    if (langCode) {
      setSelectedLanguage(langCode);
    }
  };

  if (loading) return <div className="app"><div style={{padding: '2rem'}}>Loading data from database...</div></div>;
  if (error) return <div className="app"><div style={{padding: '2rem', color: 'red'}}>Error: {error}</div></div>;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__left">
          <div className="brand">
            <div className="brand__title">Wikipedia Species Interest Dashboard</div>
            <div className="brand__subtitle">Explore species pageviews by language and region</div>
          </div>
        </div>

        <div className="topbar__right">
          <div className="pill">
            {selectedMonth ? `Month: ${selectedMonth}` : "All Months"}
          </div>
          <div className="pill">
            {selectedLanguage ? `Language: ${selectedLanguage}` : "Select a country"}
          </div>
        </div>
      </header>

      <main className="dashboard">
        <aside className="panel panel--left">
          <FiltersPanel
            languages={languages}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
          />
        </aside>

        <section className="panel panel--center">
          <MapPanel
            selectedIso3={selectedIso3}
            highlightedCountries={highlightedCountries}
            onCountryClick={handleCountryClick}
            mapIntensityByIso3={mapIntensityByIso3}
            geojsonUrl="/data/world.geojson"
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
          />
        </section>

        <aside className="panel panel--right">
          <DetailsPanel
            selectedLanguage={selectedLanguage}
            topSpecies={topSpecies}
          />
        </aside>
      </main>
    </div>
  );
}
