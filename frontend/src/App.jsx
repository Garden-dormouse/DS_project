import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";

import { api } from "./services/api.js";

function sortMonths(months) {
  return [...months].sort((a, b) => a.localeCompare(b));
}

function getMonthRange(availableMonths, startMonth, endMonth) {
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

function aggregateMapData(results) {
  return results.reduce((acc, current) => {
    Object.entries(current || {}).forEach(([iso3, value]) => {
      acc[iso3] = (acc[iso3] || 0) + Number(value || 0);
    });
    return acc;
  }, {});
}

function formatRangeLabel(monthsInRange, availableMonths) {
  if (!monthsInRange.length) return "All Months";
  if (monthsInRange.length === availableMonths.length) return "All Months";
  if (monthsInRange.length === 1) return monthsInRange[0];
  return `${monthsInRange[0]} → ${monthsInRange[monthsInRange.length - 1]}`;
}

export default function App() {
  const [selectedIso3, setSelectedIso3] = useState(null);
<<<<<<< Updated upstream
  const [selectedLanguage, setSelectedLanguage] = useState(null); // ISO 639-3
=======
  const [selectedLanguage, setSelectedLanguage] = useState(null);
>>>>>>> Stashed changes
  const [highlightedCountries, setHighlightedCountries] = useState([]);

  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);

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

        const safeLanguages = Array.isArray(languagesData) ? languagesData : [];
        const safeMonths = sortMonths(Array.isArray(monthsData) ? monthsData : []);

        setLanguages(safeLanguages);
        setAvailableMonths(safeMonths);

        if (safeMonths.length) {
          setStartMonth(safeMonths[0]);
          setEndMonth(safeMonths[safeMonths.length - 1]);
        }
      } catch (err) {
        setError(err.message || "Failed to load initial data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const monthsInRange = useMemo(() => {
    return getMonthRange(availableMonths, startMonth, endMonth);
  }, [availableMonths, startMonth, endMonth]);

  const selectedRangeLabel = useMemo(() => {
    return formatRangeLabel(monthsInRange, availableMonths);
  }, [monthsInRange, availableMonths]);

  useEffect(() => {
    async function fetchMapData() {
      try {
        if (!availableMonths.length) {
          setMapIntensityByIso3({});
          return;
        }

        const targetMonths = monthsInRange.length ? monthsInRange : availableMonths;

        const mapDataResults = await Promise.all(
          targetMonths.map((month) => api.getLanguagesMapData({ month }))
        );

        setMapIntensityByIso3(aggregateMapData(mapDataResults));
      } catch (err) {
        console.error("Error fetching map data:", err);
        setMapIntensityByIso3({});
      }
    }

    fetchMapData();
  }, [availableMonths, monthsInRange]);

  useEffect(() => {
    if (!selectedLanguage || !startMonth || !endMonth) {
      setTopSpecies([]);
      setHighlightedCountries([]);
      setSelectedIso3(null);
      return;
    }

    async function fetchLanguageData() {
      try {
        const [topSpeciesData, countries] = await Promise.all([
          api.getTopSpeciesByLanguage(selectedLanguage, {
            limit: 20,
            startMonth,
            endMonth,
          }),
          api.getLanguageCountries(selectedLanguage),
        ]);

        const safeCountries = Array.isArray(countries) ? countries : [];

        setTopSpecies(Array.isArray(topSpeciesData) ? topSpeciesData : []);
        setHighlightedCountries(safeCountries);
        setSelectedIso3(safeCountries.length > 0 ? safeCountries[0] : null);
      } catch (err) {
        console.error("Error fetching language data:", err);
        setTopSpecies([]);
        setHighlightedCountries([]);
      }
    }

    fetchLanguageData();
  }, [selectedLanguage, startMonth, endMonth]);

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
<<<<<<< Updated upstream
      setSelectedLanguage(matchedLanguage.code); // ISO 639-3
=======
      setSelectedLanguage(matchedLanguage.code);
>>>>>>> Stashed changes
    }
  };

  const handleSelectRangeMonth = (month) => {
    if (!month) return;

    if (!startMonth || !endMonth) {
      setStartMonth(month);
      setEndMonth(month);
      return;
    }

    const startDiff = Math.abs(month.localeCompare(startMonth));
    const endDiff = Math.abs(month.localeCompare(endMonth));

    if (startDiff <= endDiff) {
      setStartMonth(month);
    } else {
      setEndMonth(month);
    }
  };

  const handleResetRange = () => {
    if (!availableMonths.length) return;
    setStartMonth(availableMonths[0]);
    setEndMonth(availableMonths[availableMonths.length - 1]);
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
          <div className="pill">Range: {selectedRangeLabel}</div>
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
            startMonth={startMonth}
            endMonth={endMonth}
            onStartMonthChange={setStartMonth}
            onEndMonthChange={setEndMonth}
            availableMonths={availableMonths}
            monthsInRange={monthsInRange}
            onTimelineMonthClick={handleSelectRangeMonth}
            onResetRange={handleResetRange}
          />
        </section>

        <aside className="panel panel--right">
          <DetailsPanel
            selectedLanguage={selectedLanguageName || selectedLanguage}
            topSpecies={topSpecies}
            selectedRangeLabel={selectedRangeLabel}
            startMonth={startMonth}
            endMonth={endMonth}
          />
        </aside>
      </main>
    </div>
  );
}