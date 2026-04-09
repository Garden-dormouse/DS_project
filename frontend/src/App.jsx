import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";
import AnalysisDrawer from "./components/AnalysisDrawer.jsx";
import SpeciesFiltersPanel from "./components/SpeciesFiltersPanel.jsx";
import SpeciesLanguagePanel from "./components/SpeciesLanguagePanel.jsx";
import SpeciesAnalysisDrawer from "./components/SpeciesAnalysisDrawer.jsx";

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
  const [viewMode, setViewMode] = useState("language");

  const [selectedIso3, setSelectedIso3] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState(null);

  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [selectedLanguageForSpeciesView, setSelectedLanguageForSpeciesView] = useState(null);

  const [languageRange, setLanguageRange] = useState(null);
  const [speciesModeLanguageRange, setSpeciesModeLanguageRange] = useState(null);
  const [languageRangeCache, setLanguageRangeCache] = useState({});

  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
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
    async function loadData() {
      try {
        setLoading(true);

        const [languagesData, speciesData, monthsData, speciesTypesData] =
          await Promise.all([
            api.getLanguages(),
            api.getSpecies(),
            api.getMonths(),
            api.getSpeciesTypes(),
          ]);

        const safeLanguages = Array.isArray(languagesData) ? languagesData : [];
        const safeSpecies = Array.isArray(speciesData) ? speciesData : [];
        const safeMonths = sortMonths(Array.isArray(monthsData) ? monthsData : []);
        const safeSpeciesTypes = Array.isArray(speciesTypesData)
          ? speciesTypesData
          : [];

        setLanguages(safeLanguages);
        setSpeciesList(safeSpecies);
        setAvailableMonths(safeMonths);
        setSpeciesTypes(safeSpeciesTypes);

        if (safeMonths.length > 0) {
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

  useEffect(() => {
    async function fetchMapData() {
      try {
        if (!startMonth || !endMonth || !availableMonths.length) {
          setMapIntensityByIso3({});
          return;
        }

        if (viewMode === "species" && selectedSpeciesId == null) {
          setMapIntensityByIso3({});
          return;
        }

        const result = await api.getLanguagesMapData({
          startMonth,
          endMonth,
          speciesType: selectedSpeciesType,
          speciesId: viewMode === "species" ? selectedSpeciesId : null,
        });

        setMapIntensityByIso3(result || {});
      } catch (err) {
        console.error("Error fetching map data:", err);
        setMapIntensityByIso3({});
      }
    }

    fetchMapData();
  }, [
    availableMonths,
    monthsInRange,
    selectedSpeciesType,
    startMonth,
    endMonth,
    viewMode,
    selectedSpeciesId,
  ]);

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
  }, [
    viewMode,
    selectedLanguages,
    startMonth,
    endMonth,
    selectedSpeciesType,
    languageRangeCache,
  ]);

  useEffect(() => {
    if (viewMode !== "language") {
      setTimeseries([]);
      return;
    }

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
    viewMode,
    selectedLanguages,
    selectedSpecies,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
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

  useEffect(() => {
    if (viewMode !== "species") {
      setSpeciesModeLanguageRange(null);
      return;
    }

    if (!topLanguages.length) {
      setSpeciesModeLanguageRange(null);
      return;
    }

    async function fetchSpeciesModeRanges() {
      try {
        const codes = topLanguages.map((row) => row.code).filter(Boolean);

        const missingCodes = codes.filter((code) => !languageRangeCache[code]);

        let fetchedRangeEntries = [];
        if (missingCodes.length > 0) {
          fetchedRangeEntries = await Promise.all(
            missingCodes.map(async (code) => {
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

        const selectedRanges = codes.map((code) => mergedCache[code]).filter(Boolean);
        setSpeciesModeLanguageRange(mergeLanguageRanges(selectedRanges));
      } catch (err) {
        console.error("Error fetching species-mode language ranges:", err);
        setSpeciesModeLanguageRange(null);
      }
    }

    fetchSpeciesModeRanges();
  }, [viewMode, topLanguages, languageRangeCache]);

  useEffect(() => {
    if (viewMode !== "species") {
      setSpeciesLanguageTimeseries([]);
      return;
    }

    if (selectedSpeciesId == null || !startMonth || !endMonth) {
      setSpeciesLanguageTimeseries([]);
      return;
    }

    async function fetchSpeciesLanguageTimeseries() {
      try {
        setSpeciesLanguageTimeseriesLoading(true);

        if (!selectedLanguageForSpeciesView) {
          const responses = await Promise.all(
            topLanguages.map((row) =>
              api.getTimeseries({
                languageCode: row.code,
                speciesId: selectedSpeciesId,
                startMonth,
                endMonth,
                speciesType: selectedSpeciesType,
              })
            )
          );

          setSpeciesLanguageTimeseries(
            mergeTimeseriesResults(responses, monthsInRange)
          );
        } else {
          const rows = await api.getTimeseries({
            languageCode: selectedLanguageForSpeciesView,
            speciesId: selectedSpeciesId,
            startMonth,
            endMonth,
            speciesType: selectedSpeciesType,
          });

          setSpeciesLanguageTimeseries(
            mergeTimeseriesResults([rows], monthsInRange)
          );
        }
      } catch (err) {
        console.error("Error fetching species-language timeseries:", err);
        setSpeciesLanguageTimeseries([]);
      } finally {
        setSpeciesLanguageTimeseriesLoading(false);
      }
    }

    fetchSpeciesLanguageTimeseries();
  }, [
    viewMode,
    selectedSpeciesId,
    selectedLanguageForSpeciesView,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
    topLanguages,
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

    async function fetchSpeciesAnalysisData() {
      try {
        setSpeciesAggregateTimeseriesLoading(true);
        setTopLanguageTimeseriesLoading(true);

        const allResponses = await Promise.all(
          topLanguages.map((row) =>
            api.getTimeseries({
              languageCode: row.code,
              speciesId: selectedSpeciesId,
              startMonth,
              endMonth,
              speciesType: selectedSpeciesType,
            })
          )
        );

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
      } catch (err) {
        console.error("Error fetching species analysis data:", err);
        setSpeciesAggregateTimeseries([]);
        setTopLanguageTimeseries([]);
      } finally {
        setSpeciesAggregateTimeseriesLoading(false);
        setTopLanguageTimeseriesLoading(false);
      }
    }

    fetchSpeciesAnalysisData();
  }, [
    viewMode,
    selectedSpeciesId,
    startMonth,
    endMonth,
    selectedSpeciesType,
    monthsInRange,
    topLanguages,
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