import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";
import AnalysisDrawer from "./components/AnalysisDrawer.jsx";
import SpeciesFiltersPanel from "./components/SpeciesFiltersPanel.jsx";
import SpeciesLanguagePanel from "./components/SpeciesLanguagePanel.jsx";
import SpeciesAnalysisDrawer from "./components/SpeciesAnalysisDrawer.jsx";

import {
  useLanguages,
  useSpecies,
  useAvailableMonths,
  useSpeciesTypes,
  useLanguageRange,
  useLanguagesMapData,
  useTopSpeciesByLanguage,
  useTopLanguagesBySpecies,
  useTimeseries,
  useTopSpeciesByLanguageBatch,
  useLanguageRangeBatch,
  useTimeseriesBatch,
} from "./hooks/useApi.js";

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
          type: row.type || null,
          pageviews: Number(row.pageviews || 0),
        });
      } else {
        merged.get(key).pageviews += Number(row.pageviews || 0);
        if (!merged.get(key).type && row.type) {
          merged.get(key).type = row.type;
        }
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
  // React Query hooks - handle caching automatically
  const { data: languages = [] } = useLanguages();
  const { data: speciesList = [] } = useSpecies();
  const { data: availableMonths = [] } = useAvailableMonths();
  const { data: speciesTypes = [] } = useSpeciesTypes();

  const [viewMode, setViewMode] = useState("language");

  const [selectedIso3, setSelectedIso3] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState(null);

  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [selectedLanguageForSpeciesView, setSelectedLanguageForSpeciesView] = useState(null);

  const [languageRange, setLanguageRange] = useState(null);
  const [speciesModeLanguageRange, setSpeciesModeLanguageRange] = useState(null);

  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mapIntensityByIso3, setMapIntensityByIso3] = useState({});
  const [topSpecies, setTopSpecies] = useState([]);

  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [timeseriesLoading, setTimeseriesLoading] = useState(false);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisSpecies, setAnalysisSpecies] = useState(null);

  const [topSpeciesTimeseries, setTopSpeciesTimeseries] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [topLanguages, setTopLanguages] = useState([]);
  const [speciesLanguageTimeseries, setSpeciesLanguageTimeseries] = useState([]);
  const [speciesLanguageTimeseriesLoading, setSpeciesLanguageTimeseriesLoading] =
    useState(false);

  const [isSpeciesAnalysisOpen, setIsSpeciesAnalysisOpen] = useState(false);
  const [speciesAggregateTimeseries, setSpeciesAggregateTimeseries] = useState([]);
  const [speciesAggregateTimeseriesLoading, setSpeciesAggregateTimeseriesLoading] =
    useState(false);
  const [topLanguageTimeseries, setTopLanguageTimeseries] = useState([]);
  const [topLanguageTimeseriesLoading, setTopLanguageTimeseriesLoading] =
    useState(false);

  useEffect(() => {
    if (availableMonths.length > 0 && !startMonth && !endMonth) {
      const sorted = sortMonths(availableMonths);
      setStartMonth(sorted[0]);
      setEndMonth(sorted[sorted.length - 1]);
      setLoading(false);
    }
  }, [availableMonths, startMonth, endMonth]);

  const monthsInRange = useMemo(() => {
    return getMonthRange(availableMonths, startMonth, endMonth);
  }, [availableMonths, startMonth, endMonth]);

  const selectedRangeLabel = useMemo(() => {
    return formatRangeLabel(monthsInRange, availableMonths);
  }, [monthsInRange, availableMonths]);

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

  const selectedSpeciesObject = useMemo(() => {
    return speciesList.find((s) => s.id === selectedSpeciesId) || null;
  }, [speciesList, selectedSpeciesId]);

  const activeTypeColor = useMemo(() => {
    if (viewMode === "species") {
      return getTypeColor(selectedSpeciesObject?.type || selectedSpeciesType);
    }
    return getTypeColor(selectedSpeciesType);
  }, [viewMode, selectedSpeciesObject, selectedSpeciesType]);

  // Use React Query hook for map data (automatically cached)
  const mapFilters = useMemo(() => {
    if (!startMonth || !endMonth || !availableMonths.length) return null;
    if (viewMode === "species" && selectedSpeciesId == null) return null;

    return {
      startMonth,
      endMonth,
      speciesType: selectedSpeciesType,
      speciesId: viewMode === "species" ? selectedSpeciesId : null,
    };
  }, [startMonth, endMonth, availableMonths, selectedSpeciesType, viewMode, selectedSpeciesId]);

  const { data: mapData } = useLanguagesMapData(mapFilters);

  useEffect(() => {
    setMapIntensityByIso3(mapData || {});
  }, [mapData]);

  // Batch fetch top species for all selected languages (cached per language)
  const topSpeciesQueries = useTopSpeciesByLanguageBatch(
    viewMode === "language" && selectedLanguages.length > 0 ? selectedLanguages : [],
    {
      limit: 100,
      startMonth,
      endMonth,
      speciesType: selectedSpeciesType,
    }
  );

  // Batch fetch language ranges for all selected languages (cached per language)
  const languageRangeQueries = useLanguageRangeBatch(
    viewMode === "language" && selectedLanguages.length > 0 ? selectedLanguages : []
  );

  // Update state when queries complete
  useEffect(() => {
    if (viewMode !== "language") {
      setTopSpecies([]);
      setLanguageRange(null);
      setSelectedIso3(null);
      setSelectedSpecies(null);
      return;
    }

    if (!selectedLanguages.length || !startMonth || !endMonth) {
      setTopSpecies([]);
      setLanguageRange(null);
      setSelectedIso3(null);
      setSelectedSpecies(null);
      return;
    }

    // Check if all queries are done
    const allLoaded = topSpeciesQueries.every((q) => !q.isPending) &&
                      languageRangeQueries.every((q) => !q.isPending);

    if (!allLoaded) return;

    try {
      // Extract data from queries (each individually cached)
      const topSpeciesResponses = topSpeciesQueries.map((q) => q.data || []);
      const languageRanges = languageRangeQueries.map((q) => q.data);

      setTopSpecies(mergeTopSpeciesResults(topSpeciesResponses, 20));
      setLanguageRange(mergeLanguageRanges(languageRanges));
      setSelectedIso3(null);
      setSelectedSpecies(null);
    } catch (err) {
      console.error("Error processing language data:", err);
      setTopSpecies([]);
      setLanguageRange(null);
      setSelectedSpecies(null);
    }
  }, [
    viewMode,
    selectedLanguages,
    startMonth,
    endMonth,
    selectedSpeciesType,
    topSpeciesQueries,
    languageRangeQueries,
  ]);

  // Batch fetch timeseries for all selected languages (cached per language)
  const timeseriesQueries = useTimeseriesBatch(
    {
      speciesId: selectedSpecies?.id,
      startMonth,
      endMonth,
      speciesType: selectedSpeciesType,
    },
    viewMode === "language" && selectedLanguages.length > 0 ? selectedLanguages : []
  );

  useEffect(() => {
    if (viewMode !== "language") {
      setTimeseries([]);
      return;
    }

    if (!selectedLanguages.length || !startMonth || !endMonth) {
      setTimeseries([]);
      return;
    }

    // Check if all queries are done
    const allLoaded = timeseriesQueries.every((q) => !q.isPending);
    if (!allLoaded) {
      setTimeseriesLoading(true);
      return;
    }

    try {
      const responses = timeseriesQueries.map((q) => q.data || []);
      setTimeseries(mergeTimeseriesResults(responses, monthsInRange));
      setTimeseriesLoading(false);
    } catch (err) {
      console.error("Error processing timeseries:", err);
      setTimeseries([]);
      setTimeseriesLoading(false);
    }
  }, [
    viewMode,
    selectedLanguages,
    selectedSpecies,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
    timeseriesQueries,
  ]);

  useEffect(() => {
    if (viewMode !== "language") {
      setTopSpeciesTimeseries([]);
      return;
    }

    if (!selectedLanguages.length || !startMonth || !endMonth || !topSpecies.length) {
      setTopSpeciesTimeseries([]);
      return;
    }

    async function fetchTopSpeciesTimeseries() {
      try {
        setAnalysisLoading(true);

        const speciesResults = await Promise.all(
          topSpecies.map(async (species) => {
            const responses = await Promise.all(
              selectedLanguages.map((languageCode) =>
                api.getTimeseries({
                  languageCode,
                  speciesId: species.id,
                  startMonth,
                  endMonth,
                  speciesType: selectedSpeciesType,
                })
              )
            );

            return {
              id: species.id,
              latin_name: species.latin_name,
              type: species.type || null,
              totalPageviews: species.pageviews,
              timeseries: mergeTimeseriesResults(responses, monthsInRange),
            };
          })
        );

        setTopSpeciesTimeseries(speciesResults);
      } catch (err) {
        console.error("Error fetching top species timeseries:", err);
        setTopSpeciesTimeseries([]);
      } finally {
        setAnalysisLoading(false);
      }
    }

    fetchTopSpeciesTimeseries();
  }, [
    viewMode,
    topSpecies,
    selectedLanguages,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
  ]);

  useEffect(() => {
    if (viewMode !== "species") {
      setTopLanguages([]);
      setSelectedLanguageForSpeciesView(null);
      return;
    }

    if (selectedSpeciesId == null || !startMonth || !endMonth) {
      setTopLanguages([]);
      setSelectedLanguageForSpeciesView(null);
      return;
    }

    async function fetchTopLanguages() {
      try {
        const rows = await api.getTopLanguagesBySpecies({
          speciesId: selectedSpeciesId,
          limit: 20,
          startMonth,
          endMonth,
          speciesType: selectedSpeciesType,
        });

        const safeRows = Array.isArray(rows) ? rows : [];
        setTopLanguages(safeRows);

        const codes = safeRows.map((row) => row.code).filter(Boolean);
        if (selectedLanguageForSpeciesView && !codes.includes(selectedLanguageForSpeciesView)) {
          setSelectedLanguageForSpeciesView(null);
        }
      } catch (err) {
        console.error("Error fetching top languages by species:", err);
        setTopLanguages([]);
        setSelectedLanguageForSpeciesView(null);
      }
    }

    fetchTopLanguages();
  }, [
    viewMode,
    selectedSpeciesId,
    startMonth,
    endMonth,
    selectedSpeciesType,
  ]);

  // Batch fetch language ranges for species mode (cached per language)
  const speciesModeRangeQueries = useLanguageRangeBatch(
    viewMode === "species" && topLanguages.length > 0
      ? topLanguages.map((row) => row.code).filter(Boolean)
      : []
  );

  useEffect(() => {
    if (viewMode !== "species") {
      setSpeciesModeLanguageRange(null);
      return;
    }

    if (!topLanguages.length) {
      setSpeciesModeLanguageRange(null);
      return;
    }

    // Check if all queries are done
    const allLoaded = speciesModeRangeQueries.every((q) => !q.isPending);
    if (!allLoaded) return;

    try {
      const languageRanges = speciesModeRangeQueries.map((q) => q.data);
      setSpeciesModeLanguageRange(mergeLanguageRanges(languageRanges));
    } catch (err) {
      console.error("Error processing species-mode language ranges:", err);
      setSpeciesModeLanguageRange(null);
    }
  }, [viewMode, topLanguages, speciesModeRangeQueries]);

  // Batch fetch timeseries for species view (all top languages)
  const speciesLanguageTimeseriesQueries = useTimeseriesBatch(
    {
      speciesId: selectedSpeciesId,
      startMonth,
      endMonth,
      speciesType: selectedSpeciesType,
    },
    viewMode === "species" &&
      !selectedLanguageForSpeciesView &&
      topLanguages.length > 0
      ? topLanguages.map((row) => row.code).filter(Boolean)
      : []
  );

  // Single timeseries for selected language in species view
  const selectedSpeciesLanguageTimeseries = useTimeseries(
    viewMode === "species" && selectedLanguageForSpeciesView
      ? {
          languageCode: selectedLanguageForSpeciesView,
          speciesId: selectedSpeciesId,
          startMonth,
          endMonth,
          speciesType: selectedSpeciesType,
        }
      : null
  );

  useEffect(() => {
    if (viewMode !== "species") {
      setSpeciesLanguageTimeseries([]);
      return;
    }

    if (selectedSpeciesId == null || !startMonth || !endMonth) {
      setSpeciesLanguageTimeseries([]);
      return;
    }

    if (!selectedLanguageForSpeciesView) {
      // Multiple languages - use batch queries
      const allLoaded = speciesLanguageTimeseriesQueries.every((q) => !q.isPending);
      if (!allLoaded) {
        setSpeciesLanguageTimeseriesLoading(true);
        return;
      }

      try {
        const responses = speciesLanguageTimeseriesQueries.map((q) => q.data || []);
        setSpeciesLanguageTimeseries(
          mergeTimeseriesResults(responses, monthsInRange)
        );
        setSpeciesLanguageTimeseriesLoading(false);
      } catch (err) {
        console.error("Error processing species-language timeseries:", err);
        setSpeciesLanguageTimeseries([]);
        setSpeciesLanguageTimeseriesLoading(false);
      }
    } else {
      // Single language - use single query
      if (selectedSpeciesLanguageTimeseries.isPending) {
        setSpeciesLanguageTimeseriesLoading(true);
        return;
      }

      try {
        const rows = selectedSpeciesLanguageTimeseries.data || [];
        setSpeciesLanguageTimeseries(
          mergeTimeseriesResults([rows], monthsInRange)
        );
        setSpeciesLanguageTimeseriesLoading(false);
      } catch (err) {
        console.error("Error processing selected species-language timeseries:", err);
        setSpeciesLanguageTimeseries([]);
        setSpeciesLanguageTimeseriesLoading(false);
      }
    }
  }, [
    viewMode,
    selectedSpeciesId,
    selectedLanguageForSpeciesView,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
    topLanguages,
    speciesLanguageTimeseriesQueries,
    selectedSpeciesLanguageTimeseries,
  ]);

  useEffect(() => {
    if (viewMode !== "species") {
      setSpeciesAggregateTimeseries([]);
      setTopLanguageTimeseries([]);
      return;
    }

    if (selectedSpeciesId == null || !startMonth || !endMonth || !topLanguages.length) {
      setSpeciesAggregateTimeseries([]);
      setTopLanguageTimeseries([]);
      return;
    }

    if (selectedLanguageForSpeciesView) {
      // If a specific language is selected, skip the aggregate
      setSpeciesAggregateTimeseries([]);
      setTopLanguageTimeseries([]);
      return;
    }

    // Use the batch queries for all languages (reuse from speciesLanguageTimeseriesQueries)
    const allLoaded = speciesLanguageTimeseriesQueries.every((q) => !q.isPending);
    if (!allLoaded) {
      setSpeciesAggregateTimeseriesLoading(true);
      setTopLanguageTimeseriesLoading(true);
      return;
    }

    try {
      const allResponses = speciesLanguageTimeseriesQueries.map((q) => q.data || []);

      setSpeciesAggregateTimeseries(
        mergeTimeseriesResults(allResponses, monthsInRange)
      );

      const languageResults = topLanguages.map((row, idx) => ({
        code: row.code,
        name: row.name,
        totalPageviews: row.pageviews,
        timeseries: mergeTimeseriesResults([allResponses[idx]], monthsInRange),
      }));

      setTopLanguageTimeseries(languageResults);
      setSpeciesAggregateTimeseriesLoading(false);
      setTopLanguageTimeseriesLoading(false);
    } catch (err) {
      console.error("Error processing species analysis data:", err);
      setSpeciesAggregateTimeseries([]);
      setTopLanguageTimeseries([]);
      setSpeciesAggregateTimeseriesLoading(false);
      setTopLanguageTimeseriesLoading(false);
    }
  }, [
    viewMode,
    selectedSpeciesId,
    selectedLanguageForSpeciesView,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
    topLanguages,
    speciesLanguageTimeseriesQueries,
  ]);

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

  const handleOpenSpeciesAnalysis = () => {
    setIsSpeciesAnalysisOpen(true);
  };

  const handleCloseSpeciesAnalysis = () => {
    setIsSpeciesAnalysisOpen(false);
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
            <div
              className="pill"
              style={{ display: "flex", gap: 6, alignItems: "center" }}
            >
              <button
                type="button"
                className="btn"
                style={{
                  minWidth: 120,
                  padding: "6px 10px",
                  background:
                    viewMode === "language"
                      ? "rgba(96,165,250,0.16)"
                      : "rgba(255,255,255,0.03)",
                }}
                onClick={() => setViewMode("language")}
              >
                By Language
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  minWidth: 120,
                  padding: "6px 10px",
                  background:
                    viewMode === "species"
                      ? "rgba(96,165,250,0.16)"
                      : "rgba(255,255,255,0.03)",
                }}
                onClick={() => setViewMode("species")}
              >
                By Species
              </button>
            </div>

            <div className="pill">Range: {selectedRangeLabel}</div>

            {viewMode === "language" ? (
              <div className="pill">
                {selectedLanguageLabel
                  ? `Languages: ${selectedLanguageLabel}`
                  : "Select language(s)"}
              </div>
            ) : (
              <div className="pill">
                {selectedSpeciesObject
                  ? `Species: ${selectedSpeciesObject.latin_name}`
                  : "Select a species"}
              </div>
            )}

            <div className="pill">
              {selectedSpeciesType ? `Type: ${selectedSpeciesType}` : "All types"}
            </div>
          </div>
        </header>

        <main className="dashboard">
          <aside className="panel panel--left">
            {viewMode === "language" ? (
              <FiltersPanel
                languages={languages}
                selectedLanguages={selectedLanguages}
                onChangeSelectedLanguages={setSelectedLanguages}
                speciesTypes={speciesTypes}
                selectedSpeciesType={selectedSpeciesType}
                onSelectSpeciesType={setSelectedSpeciesType}
              />
            ) : (
              <SpeciesFiltersPanel
                speciesList={speciesList}
                selectedSpeciesId={selectedSpeciesId}
                onSelectSpeciesId={setSelectedSpeciesId}
                speciesTypes={speciesTypes}
                selectedSpeciesType={selectedSpeciesType}
                onSelectSpeciesType={setSelectedSpeciesType}
              />
            )}
          </aside>

          <section className="panel panel--center">
            <MapPanel
              selectedIso3={selectedIso3}
              languageRange={viewMode === "language" ? languageRange : speciesModeLanguageRange}
              onCountryClick={handleCountryClick}
              mapIntensityByIso3={mapIntensityByIso3}
              geojsonUrl="/data/world.geojson"
              startMonth={startMonth}
              endMonth={endMonth}
              onStartMonthChange={handleStartMonthChange}
              onEndMonthChange={handleEndMonthChange}
              onResetRange={handleResetRange}
              availableMonths={availableMonths}
              accentColor={activeTypeColor}
              speciesType={
                viewMode === "species"
                  ? selectedSpeciesObject?.type || selectedSpeciesType
                  : selectedSpeciesType
              }
            />
          </section>

          <aside className="panel panel--right">
            {viewMode === "language" ? (
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
            ) : (
              <SpeciesLanguagePanel
                selectedSpecies={selectedSpeciesObject}
                topLanguages={topLanguages}
                selectedRangeLabel={selectedRangeLabel}
                selectedLanguageCode={selectedLanguageForSpeciesView}
                onSelectLanguageCode={setSelectedLanguageForSpeciesView}
                timeseries={speciesLanguageTimeseries}
                timeseriesLoading={speciesLanguageTimeseriesLoading}
                onOpenAnalysis={handleOpenSpeciesAnalysis}
                accentColor={activeTypeColor}
              />
            )}
          </aside>
        </main>
      </div>

      {viewMode === "language" && (
        <AnalysisDrawer
          isOpen={isAnalysisOpen}
          species={analysisSpecies}
          selectedLanguages={selectedLanguageObjects}
          selectedRangeLabel={selectedRangeLabel}
          timeseries={timeseries}
          timeseriesLoading={timeseriesLoading}
          topSpeciesTimeseries={topSpeciesTimeseries}
          analysisLoading={analysisLoading}
          onClose={handleCloseAnalysis}
          accentColor={activeTypeColor}
        />
      )}

      {viewMode === "species" && (
        <SpeciesAnalysisDrawer
          isOpen={isSpeciesAnalysisOpen}
          species={selectedSpeciesObject}
          selectedRangeLabel={selectedRangeLabel}
          aggregateTimeseries={speciesAggregateTimeseries}
          aggregateTimeseriesLoading={speciesAggregateTimeseriesLoading}
          topLanguageTimeseries={topLanguageTimeseries}
          analysisLoading={topLanguageTimeseriesLoading}
          selectedLanguageCode={selectedLanguageForSpeciesView}
          onClose={handleCloseSpeciesAnalysis}
          accentColor={activeTypeColor}
        />
      )}
    </>
  );
}