import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";

import { api } from "./services/api.js";

export default function App() {
  const [selectedIso3, setSelectedIso3] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null); // glottocode
  const [highlightedCountries, setHighlightedCountries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mapIntensityByIso3, setMapIntensityByIso3] = useState({});
  const [topSpecies, setTopSpecies] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [languagesData, monthsData] = await Promise.all([
          api.getLanguages(),
          api.getMonths(),
        ]);
        setLanguages(Array.isArray(languagesData) ? languagesData : []);
        setAvailableMonths(Array.isArray(monthsData) ? monthsData : []);
      } catch (err) {
        setError(err.message);
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchMapData() {
      try {
        const filters = selectedMonth ? { month: selectedMonth } : {};
        const mapData = await api.getLanguagesMapData(filters);
        setMapIntensityByIso3(mapData || {});
      } catch (err) {
        console.error("Error fetching map data:", err);
      }
    }
    fetchMapData();
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedLanguage) {
      setTopSpecies([]);
      setHighlightedCountries([]);
      setSelectedIso3(null);
      return;
    }

    async function fetchLanguageData() {
      try {
        const [topSpeciesData, countries] = await Promise.all([
          api.getTopSpeciesByLanguage(selectedLanguage, { limit: 20 }),
          api.getLanguageCountries(selectedLanguage),
        ]);

        const safeCountries = Array.isArray(countries) ? countries : [];

        setTopSpecies(Array.isArray(topSpeciesData) ? topSpeciesData : []);
        setHighlightedCountries(safeCountries);
        setSelectedIso3(safeCountries.length > 0 ? safeCountries[0] : null);

        if (safeCountries.length > 0) {
          setSelectedIso3(safeCountries[0]);
        }
      } catch (err) {
        console.error("Error fetching language data:", err);
        setTopSpecies([]);
        setHighlightedCountries([]);
      }
    }

    fetchLanguageData();
  }, [selectedLanguage]);

  // Country -> language NAME
  const iso3ToLanguageName = useMemo(() => {
    return {
      USA: "English",
      GBR: "English",
      CAN: "English",
      AUS: "English",
      NZL: "English",
      IRL: "English",

      FIN: "Finnish",

      SWE: "Swedish",
      NOR: "Swedish",

      FRA: "French",
      BEL: "French",
      CHE: "French",
      LUX: "French",

      DEU: "German",
      AUT: "German",
      LIE: "German",

      ESP: "Spanish",
      MEX: "Spanish",
      ARG: "Spanish",
      COL: "Spanish",
      PER: "Spanish",
      VEN: "Spanish",
      CHL: "Spanish",

      CHN: "Chinese",
      TWN: "Chinese",
      SGP: "Chinese",

      JPN: "Japanese",

      PRT: "Portuguese",
      BRA: "Portuguese",

      ITA: "Italian",

      RUS: "Russian",
      BLR: "Russian",
      KAZ: "Russian",

      SAU: "Arabic",
      EGY: "Arabic",
      ARE: "Arabic",
      JOR: "Arabic",
      LBN: "Arabic",

      NLD: "Dutch",
      POL: "Polish",
      TUR: "Turkish",
      KOR: "Korean",
    };
  }, []);

  const selectedLanguageObj = useMemo(() => {
    return languages.find((l) => l.code === selectedLanguage) || null;
  }, [languages, selectedLanguage]);

  const selectedLanguageName = selectedLanguageObj?.name || null;

  const handleCountryClick = (iso3) => {
    setSelectedIso3(iso3);

    const languageName = iso3ToLanguageName[iso3];
    if (!languageName) return;

    const matchedLanguage = languages.find((l) => l.name === languageName);
    if (matchedLanguage) {
      setSelectedLanguage(matchedLanguage.code); // glottocode
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div style={{ padding: "2rem" }}>Loading data from database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__left">
          <div className="brand">
            <div className="brand__title">Wikipedia Species Interest Dashboard</div>
            <div className="brand__subtitle">
              Explore species pageviews by language and region
            </div>
          </div>
        </div>

        <div className="topbar__right">
          <div className="pill">
            {selectedMonth ? `Month: ${selectedMonth}` : "All Months"}
          </div>
          <div className="pill">
            {selectedLanguageName ? `Language: ${selectedLanguageName}` : "Select a language"}
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
            selectedLanguage={selectedLanguageName || selectedLanguage}
            topSpecies={topSpecies}
          />
        </aside>
      </main>
    </div>
  );
}