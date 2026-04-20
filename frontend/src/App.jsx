import React, { useMemo, useState } from "react";
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
  useLanguagesMapData,
  useTopLanguagesBySpecies,
  useTimeseries,
  useTopSpeciesByLanguageBatch,
  useLanguageRangeBatch,
  useTimeseriesBatch,
  useSpeciesLanguageTimeseriesBatch,
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

function formatRangeLabel(monthsInRange, availableMonths) {
  if (!monthsInRange.length) return "All Months";
  if (monthsInRange.length === availableMonths.length) return "All Months";
  if (monthsInRange.length === 1) return monthsInRange[0];
  return `${monthsInRange[0]} → ${monthsInRange[monthsInRange.length - 1]}`;
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
  const { data: speciesData = [] } = useSpecies();
  const { data: availableMonths = [] } = useAvailableMonths();
  const { data: speciesTypes = [] } = useSpeciesTypes();

  const speciesList = useMemo(() => {
    if (Array.isArray(speciesData)) return speciesData;
    if (Array.isArray(speciesData?.items)) return speciesData.items;
    return [];
  }, [speciesData]);

  const [viewMode, setViewMode] = useState("language");

  const [selectedIso3, setSelectedIso3] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState(null);

  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [selectedLanguageForSpeciesView, setSelectedLanguageForSpeciesView] = useState(null);

  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);

  const [selectedSpecies, setSelectedSpecies] = useState(null);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisSpecies, setAnalysisSpecies] = useState(null);

  const [isSpeciesAnalysisOpen, setIsSpeciesAnalysisOpen] = useState(false);

  const sortedAvailableMonths = useMemo(
    () => sortMonths(availableMonths),
    [availableMonths]
  );

  const effectiveStartMonth = startMonth || sortedAvailableMonths[0] || null;
  const effectiveEndMonth =
    endMonth || sortedAvailableMonths[sortedAvailableMonths.length - 1] || null;
  const loading = !effectiveStartMonth || !effectiveEndMonth;

  const monthsInRange = useMemo(() => {
    return getMonthRange(availableMonths, effectiveStartMonth, effectiveEndMonth);
  }, [availableMonths, effectiveStartMonth, effectiveEndMonth]);

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
    if (selectedSpeciesId == null) return null;
    if (selectedSpecies?.id === selectedSpeciesId) return selectedSpecies;
    return speciesList.find((species) => species.id === selectedSpeciesId) || null;
  }, [speciesList, selectedSpeciesId, selectedSpecies]);

  const activeTypeColor = useMemo(() => {
    if (viewMode === "species") {
      return getTypeColor(selectedSpeciesObject?.type || selectedSpeciesType);
    }
    return getTypeColor(selectedSpeciesType);
  }, [viewMode, selectedSpeciesObject, selectedSpeciesType]);

  // Use React Query hook for map data (automatically cached)
  const mapFilters = useMemo(() => {
    if (!effectiveStartMonth || !effectiveEndMonth || !availableMonths.length) return null;
    if (viewMode === "species" && selectedSpeciesId == null) return null;

    return {
      startMonth: effectiveStartMonth,
      endMonth: effectiveEndMonth,
      speciesType: selectedSpeciesType,
      speciesId: viewMode === "species" ? selectedSpeciesId : null,
    };
  }, [
    effectiveStartMonth,
    effectiveEndMonth,
    availableMonths,
    selectedSpeciesType,
    viewMode,
    selectedSpeciesId,
  ]);

  const { data: mapData } = useLanguagesMapData(mapFilters);
  const mapIntensityByIso3 = mapData || {};

  const hasLanguageSelection =
    viewMode === "language" &&
    selectedLanguages.length > 0 &&
    !!effectiveStartMonth &&
    !!effectiveEndMonth;

  // Batch fetch top species for all selected languages (cached per language)
  const topSpeciesQueries = useTopSpeciesByLanguageBatch(
    hasLanguageSelection ? selectedLanguages : [],
    {
      limit: 100,
      startMonth: effectiveStartMonth,
      endMonth: effectiveEndMonth,
      speciesType: selectedSpeciesType,
    }
  );

  // Batch fetch language ranges for all selected languages (cached per language)
  const languageRangeQueries = useLanguageRangeBatch(
    hasLanguageSelection ? selectedLanguages : []
  );

  const languageDataReady =
    hasLanguageSelection &&
    topSpeciesQueries.every((q) => !q.isPending) &&
    languageRangeQueries.every((q) => !q.isPending);

  const topSpecies = useMemo(() => {
    if (!languageDataReady) return [];
    const topSpeciesResponses = topSpeciesQueries.map((q) => q.data || []);
    return mergeTopSpeciesResults(topSpeciesResponses, 20);
  }, [
    languageDataReady,
    topSpeciesQueries,
  ]);

  const languageRange = useMemo(() => {
    if (!languageDataReady) return null;
    const languageRanges = languageRangeQueries.map((q) => q.data);
    return mergeLanguageRanges(languageRanges);
  }, [
    languageDataReady,
    languageRangeQueries,
  ]);

  const selectedIso3ForMap = hasLanguageSelection ? selectedIso3 : null;

  const selectedSpeciesInTop = useMemo(() => {
    if (!selectedSpecies) return null;
    return (
      topSpecies.find(
        (row) =>
          (selectedSpecies.id != null && row.id === selectedSpecies.id) ||
          row.latin_name === selectedSpecies.latin_name
      ) || null
    );
  }, [selectedSpecies, topSpecies]);

  // Batch fetch timeseries for all selected languages (cached per language)
  const timeseriesQueries = useTimeseriesBatch(
    {
      speciesId: selectedSpeciesInTop?.id,
      startMonth: effectiveStartMonth,
      endMonth: effectiveEndMonth,
      speciesType: selectedSpeciesType,
    },
    hasLanguageSelection ? selectedLanguages : []
  );

  const timeseriesLoading =
    hasLanguageSelection && timeseriesQueries.some((q) => q.isPending);

  const timeseries = useMemo(() => {
    if (!hasLanguageSelection || timeseriesLoading) return [];
    const responses = timeseriesQueries.map((q) => q.data || []);
    return mergeTimeseriesResults(responses, monthsInRange);
  }, [hasLanguageSelection, timeseriesLoading, timeseriesQueries, monthsInRange]);

  const topSpeciesIds = useMemo(
    () => topSpecies.map((species) => species.id).filter((id) => id != null),
    [topSpecies]
  );

  const topSpeciesTimeseriesQueries = useSpeciesLanguageTimeseriesBatch(
    hasLanguageSelection ? topSpeciesIds : [],
    hasLanguageSelection ? selectedLanguages : [],
    {
      startMonth: effectiveStartMonth,
      endMonth: effectiveEndMonth,
      speciesType: selectedSpeciesType,
    }
  );

  const analysisLoading =
    hasLanguageSelection &&
    topSpecies.length > 0 &&
    topSpeciesTimeseriesQueries.some((q) => q.isPending);

  const topSpeciesTimeseries = useMemo(() => {
    if (!hasLanguageSelection || !topSpecies.length || analysisLoading) return [];

    const responsesBySpeciesId = new Map();

    for (const query of topSpeciesTimeseriesQueries) {
      if (query.speciesId == null) continue;
      const existing = responsesBySpeciesId.get(query.speciesId) || [];
      responsesBySpeciesId.set(query.speciesId, [...existing, query.data || []]);
    }

    return topSpecies.map((species) => ({
      id: species.id,
      latin_name: species.latin_name,
      type: species.type || null,
      totalPageviews: species.pageviews,
      timeseries: mergeTimeseriesResults(
        responsesBySpeciesId.get(species.id) || [],
        monthsInRange
      ),
    }));
  }, [
    hasLanguageSelection,
    topSpecies,
    analysisLoading,
    topSpeciesTimeseriesQueries,
    monthsInRange,
  ]);

  const hasSpeciesSelection =
    viewMode === "species" &&
    selectedSpeciesId != null &&
    !!effectiveStartMonth &&
    !!effectiveEndMonth;

  const topLanguagesBySpeciesQuery = useTopLanguagesBySpecies({
    speciesId: hasSpeciesSelection ? selectedSpeciesId : null,
    limit: 20,
    startMonth: effectiveStartMonth,
    endMonth: effectiveEndMonth,
    speciesType: selectedSpeciesType,
  });

  const topLanguages = useMemo(() => {
    if (!hasSpeciesSelection) return [];
    if (topLanguagesBySpeciesQuery.isPending || topLanguagesBySpeciesQuery.isError) {
      return [];
    }
    return Array.isArray(topLanguagesBySpeciesQuery.data)
      ? topLanguagesBySpeciesQuery.data
      : [];
  }, [hasSpeciesSelection, topLanguagesBySpeciesQuery]);

  const selectedSpeciesLanguageCode = useMemo(() => {
    if (!selectedLanguageForSpeciesView) return null;
    const codes = new Set(topLanguages.map((row) => row.code).filter(Boolean));
    return codes.has(selectedLanguageForSpeciesView) ? selectedLanguageForSpeciesView : null;
  }, [selectedLanguageForSpeciesView, topLanguages]);

  // Batch fetch language ranges for species mode (cached per language)
  const speciesModeRangeQueries = useLanguageRangeBatch(
    viewMode === "species" && topLanguages.length > 0
      ? topLanguages.map((row) => row.code).filter(Boolean)
      : []
  );

  const speciesModeLanguageRange = useMemo(() => {
    if (viewMode !== "species" || !topLanguages.length) return null;
    if (speciesModeRangeQueries.some((q) => q.isPending)) return null;
    const languageRanges = speciesModeRangeQueries.map((q) => q.data);
    return mergeLanguageRanges(languageRanges);
  }, [viewMode, topLanguages, speciesModeRangeQueries]);

  // Batch fetch timeseries for species view (all top languages)
  const speciesLanguageTimeseriesQueries = useTimeseriesBatch(
    {
      speciesId: selectedSpeciesId,
      startMonth: effectiveStartMonth,
      endMonth: effectiveEndMonth,
      speciesType: selectedSpeciesType,
    },
    viewMode === "species" &&
      !selectedSpeciesLanguageCode &&
      topLanguages.length > 0
      ? topLanguages.map((row) => row.code).filter(Boolean)
      : []
  );

  // Single timeseries for selected language in species view
  const selectedSpeciesLanguageTimeseries = useTimeseries(
    viewMode === "species" && selectedSpeciesLanguageCode
      ? {
          languageCode: selectedSpeciesLanguageCode,
          speciesId: selectedSpeciesId,
          startMonth: effectiveStartMonth,
          endMonth: effectiveEndMonth,
          speciesType: selectedSpeciesType,
        }
      : null
  );

  const speciesLanguageTimeseriesLoading = useMemo(() => {
    if (!hasSpeciesSelection) return false;
    if (!selectedSpeciesLanguageCode) {
      return speciesLanguageTimeseriesQueries.some((q) => q.isPending);
    }
    return selectedSpeciesLanguageTimeseries.isPending;
  }, [
    hasSpeciesSelection,
    selectedSpeciesLanguageCode,
    speciesLanguageTimeseriesQueries,
    selectedSpeciesLanguageTimeseries,
  ]);

  const speciesLanguageTimeseries = useMemo(() => {
    if (!hasSpeciesSelection || speciesLanguageTimeseriesLoading) return [];
    if (!selectedSpeciesLanguageCode) {
      const responses = speciesLanguageTimeseriesQueries.map((q) => q.data || []);
      return mergeTimeseriesResults(responses, monthsInRange);
    }
    const rows = selectedSpeciesLanguageTimeseries.data || [];
    return mergeTimeseriesResults([rows], monthsInRange);
  }, [
    hasSpeciesSelection,
    speciesLanguageTimeseriesLoading,
    selectedSpeciesLanguageCode,
    speciesLanguageTimeseriesQueries,
    selectedSpeciesLanguageTimeseries,
    monthsInRange,
  ]);

  const canBuildSpeciesAggregate =
    hasSpeciesSelection && !selectedSpeciesLanguageCode && topLanguages.length > 0;

  const speciesAggregateTimeseriesLoading =
    canBuildSpeciesAggregate && speciesLanguageTimeseriesQueries.some((q) => q.isPending);

  const speciesAggregateTimeseries = useMemo(() => {
    if (!canBuildSpeciesAggregate || speciesAggregateTimeseriesLoading) return [];
    const allResponses = speciesLanguageTimeseriesQueries.map((q) => q.data || []);
    return mergeTimeseriesResults(allResponses, monthsInRange);
  }, [
    canBuildSpeciesAggregate,
    speciesAggregateTimeseriesLoading,
    speciesLanguageTimeseriesQueries,
    monthsInRange,
  ]);

  const topLanguageTimeseries = useMemo(() => {
    if (!canBuildSpeciesAggregate || speciesAggregateTimeseriesLoading) return [];
    const allResponses = speciesLanguageTimeseriesQueries.map((q) => q.data || []);
    return topLanguages.map((row, idx) => ({
      code: row.code,
      name: row.name,
      totalPageviews: row.pageviews,
      timeseries: mergeTimeseriesResults([allResponses[idx]], monthsInRange),
    }));
  }, [
    canBuildSpeciesAggregate,
    speciesAggregateTimeseriesLoading,
    speciesLanguageTimeseriesQueries,
    topLanguages,
    monthsInRange,
  ]);

  const topLanguageTimeseriesLoading = speciesAggregateTimeseriesLoading;

  const handleCountryClick = (iso3) => {
    setSelectedIso3(iso3);
  };

  const handleStartMonthChange = (value) => {
    setStartMonth(value);
    if (effectiveEndMonth && value && value > effectiveEndMonth) {
      setEndMonth(value);
    }
  };

  const handleEndMonthChange = (value) => {
    setEndMonth(value);
    if (effectiveStartMonth && value && value < effectiveStartMonth) {
      setStartMonth(value);
    }
  };

  const handleResetRange = () => {
    if (!sortedAvailableMonths.length) return;
    setStartMonth(sortedAvailableMonths[0]);
    setEndMonth(sortedAvailableMonths[sortedAvailableMonths.length - 1]);
  };

  const handleSelectSpeciesOption = (species) => {
    setSelectedSpeciesId(species?.id ?? null);
    setSelectedLanguageForSpeciesView(null);
  };

  const handleOpenAnalysis = (species) => {
    setAnalysisSpecies(species || selectedSpeciesInTop || null);
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
                selectedSpecies={selectedSpeciesObject}
                onSelectSpecies={handleSelectSpeciesOption}
                speciesTypes={speciesTypes}
                selectedSpeciesType={selectedSpeciesType}
                onSelectSpeciesType={setSelectedSpeciesType}
              />
            )}
          </aside>

          <section className="panel panel--center">
            <MapPanel
              selectedIso3={selectedIso3ForMap}
              languageRange={viewMode === "language" ? languageRange : speciesModeLanguageRange}
              onCountryClick={handleCountryClick}
              mapIntensityByIso3={mapIntensityByIso3}
              geojsonUrl="/data/world.geojson"
              startMonth={effectiveStartMonth}
              endMonth={effectiveEndMonth}
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
                startMonth={effectiveStartMonth}
                endMonth={effectiveEndMonth}
                selectedSpecies={selectedSpeciesInTop}
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
                selectedLanguageCode={selectedSpeciesLanguageCode}
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
          selectedLanguageCode={selectedSpeciesLanguageCode}
          onClose={handleCloseSpeciesAnalysis}
          accentColor={activeTypeColor}
        />
      )}
    </>
  );
}