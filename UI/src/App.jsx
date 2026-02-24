import React, { useMemo, useState } from "react";
import "./App.css";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import DetailsPanel from "./components/DetailsPanel.jsx";

import { MOCK_LANGUAGES, MOCK_SPECIES } from "./mock/mockData.js";
import { buildMockTopSpecies, buildMockTimeseries, buildMockMapIntensity } from "./mock/mockCompute.js";

export default function App() {
  // ---- Global dashboard state (frontend-only) ----
  const [selectedIso3, setSelectedIso3] = useState(null);

  const [query, setQuery] = useState({
    speciesId: MOCK_SPECIES[0].id,
    languageCodes: ["en"], // multi-select
    timeRange: {
      start: "2024-01-01",
      end: "2024-12-31",
    },
    granularity: "month", // day | week | month
    metric: "pageviews", // pageviews | log | growth (mocked)
  });

  // ---- Mock computed data (no backend) ----
  const mapIntensityByIso3 = useMemo(() => {
    return buildMockMapIntensity({
      selectedLanguages: query.languageCodes,
      speciesId: query.speciesId,
      start: query.timeRange.start,
      end: query.timeRange.end,
    });
  }, [query.languageCodes, query.speciesId, query.timeRange.start, query.timeRange.end]);

  const topSpecies = useMemo(() => {
    // If you want: ranking for selected language(s) in time range
    return buildMockTopSpecies({
      selectedLanguages: query.languageCodes,
      start: query.timeRange.start,
      end: query.timeRange.end,
    });
  }, [query.languageCodes, query.timeRange.start, query.timeRange.end]);

  const timeseries = useMemo(() => {
    return buildMockTimeseries({
      speciesId: query.speciesId,
      selectedLanguages: query.languageCodes,
      start: query.timeRange.start,
      end: query.timeRange.end,
      granularity: query.granularity,
      metric: query.metric,
    });
  }, [query.speciesId, query.languageCodes, query.timeRange.start, query.timeRange.end, query.granularity, query.metric]);

  const selectedSpecies = useMemo(
    () => MOCK_SPECIES.find((s) => s.id === query.speciesId) ?? null,
    [query.speciesId]
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__left">
          <div className="brand">
            <div className="brand__title">Wikipedia Species Interest Dashboard</div>
            <div className="brand__subtitle">Frontend prototype (mock data)</div>
          </div>
        </div>

        <div className="topbar__right">
          <div className="pill">Metric: {query.metric}</div>
          <div className="pill">Granularity: {query.granularity}</div>
        </div>
      </header>

      <main className="dashboard">
        <aside className="panel panel--left">
          <FiltersPanel
            languages={MOCK_LANGUAGES}
            species={MOCK_SPECIES}
            query={query}
            onChange={setQuery}
            onQuickPickLanguage={(code) =>
              setQuery((q) => ({ ...q, languageCodes: [code] }))
            }
          />
        </aside>

        <section className="panel panel--center">
          <MapPanel
            selectedIso3={selectedIso3}
            onCountryClick={(iso3) => setSelectedIso3(iso3)}
            mapIntensityByIso3={mapIntensityByIso3}
            // If you already have the geojson in /public/data/world.geojson keep this:
            geojsonUrl="/data/world.geojson"
          />
        </section>

        <aside className="panel panel--right">
          <DetailsPanel
            selectedIso3={selectedIso3}
            selectedSpecies={selectedSpecies}
            selectedLanguages={query.languageCodes}
            timeRange={query.timeRange}
            topSpecies={topSpecies}
            timeseries={timeseries}
            onSelectSpecies={(speciesId) => setQuery((q) => ({ ...q, speciesId }))}
          />
        </aside>
      </main>

      <footer className="footer">
        <span>
          Note: This is a UI prototype. Data are mocked. Later you’ll connect to your API (Species/Language/Timestamp/Pageview).
        </span>
      </footer>
    </div>
  );
}
