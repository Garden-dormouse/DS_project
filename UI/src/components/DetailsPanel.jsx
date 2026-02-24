import React, { useMemo } from "react";
import "./panel.css";
import MiniSparkline from "./MiniSparkline.jsx";
import { MOCK_SPECIES } from "../mock/mockData.js";

export default function DetailsPanel({
  selectedIso3,
  selectedSpecies,
  selectedLanguages,
  timeRange,
  topSpecies,
  timeseries,
  onSelectSpecies,
}) {
  const total = useMemo(() => timeseries.reduce((acc, p) => acc + p.value, 0), [timeseries]);
  const avg = useMemo(() => (timeseries.length ? Math.round(total / timeseries.length) : 0), [total, timeseries.length]);

  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Details</div>
          <div className="panelSubtitle">
            {selectedIso3 ? (
              <>
                Country: <span className="mono">{selectedIso3}</span> · Lang:{" "}
                <span className="mono">{selectedLanguages.join(", ")}</span>
              </>
            ) : (
              <>No country selected (still showing mock charts)</>
            )}
          </div>
        </div>
      </div>

      <div className="panelBody">
        <div className="kpis">
          <div className="kpi">
            <div className="kpiLabel">Total (range)</div>
            <div className="kpiValue">{formatNumber(total)}</div>
            <div className="kpiHint">{timeRange.start} → {timeRange.end}</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Average</div>
            <div className="kpiValue">{formatNumber(avg)}</div>
            <div className="kpiHint">per bucket</div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Time series</div>
              <div className="cardSubtitle">
                Species: <span className="mono">{selectedSpecies?.latin_name ?? "—"}</span>
              </div>
            </div>

            <select
              className="control control--compact"
              value={selectedSpecies?.id ?? MOCK_SPECIES[0].id}
              onChange={(e) => onSelectSpecies(Number(e.target.value))}
            >
              {MOCK_SPECIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.latin_name}
                </option>
              ))}
            </select>
          </div>

          <div className="cardBody">
            <MiniSparkline points={timeseries} />
            <div className="hint" style={{ marginTop: 10 }}>
              (mock) values are generated deterministically from the selected filters.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Top species</div>
              <div className="cardSubtitle">Ranked by total pageviews (mock)</div>
            </div>
          </div>

          <div className="cardBody">
            <ul className="list">
              {topSpecies.map((row, idx) => (
                <li key={row.species_id} className="listItem">
                  <div className="rank">{idx + 1}</div>
                  <div className="listMain">
                    <div className="listTitle">{row.latin_name}</div>
                    <div className="listSubtitle">species_id: <span className="mono">{row.species_id}</span></div>
                  </div>
                  <div className="listValue">{formatNumber(row.value)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="note">
          Later, this panel will be fed by your DB tables: Pageview(timestamp_ID, language_ID, species_ID, number_of_pageviews).
        </div>
      </div>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}
