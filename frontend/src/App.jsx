import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";
import AnalysisDrawer from "./components/AnalysisDrawer.jsx";

import { api } from "./services/api.js";

const TYPE_COLORS = {
  mammal: "#60A5FA",
  bird: "#34D399",
  reptile: "#F59E0B",
};

function getTypeColor(speciesType) {
  return TYPE_COLORS[speciesType] || "#60A5FA";
}

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

function mergeTopSpeciesResults(results, limit = 20) {
  const merged = new Map();

  for (const rows of results) {
    for (const row of Array.isArray(rows) ? rows : []) {
      const key = row.id ?? row.latin_name;
      if (!merged.has(key)) {
        merged.set(key, {
          id: row.id,
          latin_name: row.latin_name,
          pageviews: Number(row.pageviews || 0),
        });
      } else {
        merged.get(key).pageviews += Number(row.pageviews || 0);
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);
}

function normalizeRangeFeatureCollection(input) {
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

function mergeLanguageRanges(ranges) {
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

function mergeTimeseriesResults(results, months) {
  const merged = new Map();

  for (const month of months || []) {
    merged.set(month, 0);
  }

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

export default function App() {
  const [selectedIso3, setSelectedIso3] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState(null);

  const [languageRange, setLanguageRange] = useState(null);
  const [languageRangeCache, setLanguageRangeCache] = useState({});

  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [speciesTypes, setSpeciesTypes] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mapIntensityByIso3, setMapIntensityByIso3] = useState({});
  const [topSpecies, setTopSpecies] = useState([]);

  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [timeseriesLoading, setTimeseriesLoading] = useState(false);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisSpecies, setAnalysisSpecies] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [languagesData, monthsData, speciesTypesData] = await Promise.all([
          api.getLanguages(),
          api.getMonths(),
          api.getSpeciesTypes(),
        ]);

        const safeLanguages = Array.isArray(languagesData) ? languagesData : [];
        const safeMonths = sortMonths(Array.isArray(monthsData) ? monthsData : []);
        const safeSpeciesTypes = Array.isArray(speciesTypesData) ? speciesTypesData : [];

        setLanguages(safeLanguages);
        setAvailableMonths(safeMonths);
        setSpeciesTypes(safeSpeciesTypes);

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

  const activeTypeColor = useMemo(() => {
    return getTypeColor(selectedSpeciesType);
  }, [selectedSpeciesType]);

  useEffect(() => {
    async function fetchMapData() {
      try {
        if (!availableMonths.length) {
          setMapIntensityByIso3({});
          return;
        }

        const targetMonths = monthsInRange.length ? monthsInRange : availableMonths;

        const mapDataResults = await Promise.all(
          targetMonths.map((month) =>
            api.getLanguagesMapData({
              month,
              speciesType: selectedSpeciesType,
            })
          )
        );

        setMapIntensityByIso3(aggregateMapData(mapDataResults));
      } catch (err) {
        console.error("Error fetching map data:", err);
        setMapIntensityByIso3({});
      }
    }

    fetchMapData();
  }, [availableMonths, monthsInRange, selectedSpeciesType]);

  useEffect(() => {
    if (!selectedLanguages.length || !startMonth || !endMonth) {
      setTopSpecies([]);
      setLanguageRange(null);
      setSelectedIso3(null);
      setSelectedSpecies(null);
      return;
    }

    async function fetchLanguageData() {
      try {
        const topSpeciesResponses = await Promise.all(
          selectedLanguages.map((languageCode) =>
            api.getTopSpeciesByLanguage(languageCode, {
              limit: 100,
              startMonth,
              endMonth,
              speciesType: selectedSpeciesType,
            })
          )
        );

        const missingRangeCodes = selectedLanguages.filter(
          (code) => !languageRangeCache[code]
        );

        let fetchedRangeEntries = [];
        if (missingRangeCodes.length > 0) {
          fetchedRangeEntries = await Promise.all(
            missingRangeCodes.map(async (code) => {
              const range = await api.getLanguageRange(code);
              return [code, range];
            })
          );

          setLanguageRangeCache((prev) => {
            const next = { ...prev };
            for (const [code, range] of fetchedRangeEntries) {
              next[code] = range;
            }
            return next;
          });
        }

        const mergedCache = { ...languageRangeCache };
        for (const [code, range] of fetchedRangeEntries) {
          mergedCache[code] = range;
        }

        const selectedRanges = selectedLanguages
          .map((code) => mergedCache[code])
          .filter(Boolean);

        setTopSpecies(mergeTopSpeciesResults(topSpeciesResponses, 20));
        setLanguageRange(mergeLanguageRanges(selectedRanges));
        setSelectedIso3(null);
        setSelectedSpecies(null);
      } catch (err) {
        console.error("Error fetching language data:", err);
        setTopSpecies([]);
        setLanguageRange(null);
        setSelectedSpecies(null);
      }
    }

    fetchLanguageData();
  }, [selectedLanguages, startMonth, endMonth, selectedSpeciesType]);

  useEffect(() => {
    if (!selectedLanguages.length || !startMonth || !endMonth) {
      setTimeseries([]);
      return;
    }

    async function fetchTimeseries() {
      try {
        setTimeseriesLoading(true);

        const responses = await Promise.all(
          selectedLanguages.map((languageCode) =>
            api.getTimeseries({
              languageCode,
              speciesId: selectedSpecies?.id,
              startMonth,
              endMonth,
              speciesType: selectedSpeciesType,
            })
          )
        );

        setTimeseries(mergeTimeseriesResults(responses, monthsInRange));
      } catch (err) {
        console.error("Error fetching timeseries:", err);
        setTimeseries([]);
      } finally {
        setTimeseriesLoading(false);
      }
    }

    fetchTimeseries();
  }, [
    selectedLanguages,
    selectedSpecies,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
  ]);

  const selectedLanguageObjects = useMemo(() => {
    const selectedSet = new Set(selectedLanguages);
    return languages.filter((l) => selectedSet.has(l.code));
  }, [languages, selectedLanguages]);

  const selectedLanguageLabel = useMemo(() => {
    if (!selectedLanguageObjects.length) return null;
    if (selectedLanguageObjects.length <= 2) {
      return selectedLanguageObjects.map((l) => l.name).join(", ");
    }
    return `${selectedLanguageObjects.length} languages selected`;
  }, [selectedLanguageObjects]);

  const handleCountryClick = (iso3) => {
    setSelectedIso3(iso3);
  };

  const handleStartMonthChange = (value) => {
    setStartMonth(value);
    if (endMonth && value && value > endMonth) {
      setEndMonth(value);
    }
  };

  const handleEndMonthChange = (value) => {
    setEndMonth(value);
    if (startMonth && value && value < startMonth) {
      setStartMonth(value);
    }
  };

  const handleResetRange = () => {
    if (!availableMonths.length) return;
    setStartMonth(availableMonths[0]);
    setEndMonth(availableMonths[availableMonths.length - 1]);
  };

  const handleOpenAnalysis = (species) => {
    setAnalysisSpecies(species || selectedSpecies || null);
    setIsAnalysisOpen(true);
  };

  const handleCloseAnalysis = () => {
    setIsAnalysisOpen(false);
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
    <>
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
              {selectedLanguageLabel ? `Languages: ${selectedLanguageLabel}` : "Select language(s)"}
            </div>
            <div className="pill">
              {selectedSpeciesType ? `Type: ${selectedSpeciesType}` : "All types"}
            </div>
          </div>
        </header>

        <main className="dashboard">
          <aside className="panel panel--left">
            <FiltersPanel
              languages={languages}
              selectedLanguages={selectedLanguages}
              onChangeSelectedLanguages={setSelectedLanguages}
              speciesTypes={speciesTypes}
              selectedSpeciesType={selectedSpeciesType}
              onSelectSpeciesType={setSelectedSpeciesType}
            />
          </aside>

          <section className="panel panel--center">
            <MapPanel
              selectedIso3={selectedIso3}
              languageRange={languageRange}
              onCountryClick={handleCountryClick}
              mapIntensityByIso3={mapIntensityByIso3}
              geojsonUrl="/data/world.geojson"
              startMonth={startMonth}
              endMonth={endMonth}
              onStartMonthChange={handleStartMonthChange}
              onEndMonthChange={handleEndMonthChange}
              onResetRange={handleResetRange}
              accentColor={activeTypeColor}
              speciesType={selectedSpeciesType}
            />
          </section>

          <aside className="panel panel--right">
            <DetailsPanel
              selectedLanguages={selectedLanguageObjects}
              topSpecies={topSpecies}
              selectedRangeLabel={selectedRangeLabel}
              startMonth={startMonth}
              endMonth={endMonth}
              selectedSpecies={selectedSpecies}
              onSelectSpecies={setSelectedSpecies}
              timeseries={timeseries}
              timeseriesLoading={timeseriesLoading}
              onOpenAnalysis={handleOpenAnalysis}
              accentColor={activeTypeColor}
            />
          </aside>
        </main>
      </div>

      <AnalysisDrawer
        isOpen={isAnalysisOpen}
        species={analysisSpecies}
        selectedLanguages={selectedLanguageObjects}
        selectedRangeLabel={selectedRangeLabel}
        timeseries={timeseries}
        timeseriesLoading={timeseriesLoading}
        onClose={handleCloseAnalysis}
        accentColor={activeTypeColor}
      />
    </>
  );
}