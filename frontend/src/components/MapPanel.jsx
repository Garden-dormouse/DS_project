import React from "react";
import "./panel.css";
import WorldMap from "../WorldMap.jsx";

export default function MapPanel({
  selectedIso3,
  languageRange,
  onCountryClick,
  mapIntensityByIso3,
  geojsonUrl,
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
  onResetRange,
  availableMonths,
  accentColor = "#60A5FA",
  speciesType = null,
}) {
  const minMonth = availableMonths?.[0];
  const maxMonth = availableMonths?.[availableMonths.length - 1];
  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Language Activity Map</div>
          <div className="panelSubtitle">
            {startMonth && endMonth
              ? `Viewing: ${startMonth} → ${endMonth}`
              : "Viewing: All months"}
          </div>
        </div>

        <div className="rightPills" style={{ gap: 8, flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Start month</label>
            <input
              className="control control--compact"
              type="month"
              value={startMonth || ""}
              min={minMonth}
              max={maxMonth}
              onChange={(e) => onStartMonthChange(e.target.value || null)}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">End month</label>
            <input
              className="control control--compact"
              type="month"
              value={endMonth || ""}
              min={minMonth}
              max={maxMonth}
              onChange={(e) => onEndMonthChange(e.target.value || null)}
            />
          </div>

          <button
            className="btn"
            type="button"
            onClick={onResetRange}
            style={{ fontSize: 11, padding: "8px 10px", alignSelf: "end" }}
          >
            Reset
          </button>

          <div className="miniPill" style={{ alignSelf: "end" }}>
            Selected: <span className="mono">{selectedIso3 ?? "none"}</span>
          </div>

          <div
            className="miniPill"
            style={{
              alignSelf: "end",
              borderColor: `${accentColor}55`,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Type color:{" "}
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: accentColor,
                marginLeft: 6,
                verticalAlign: "middle",
              }}
            />
            <span className="mono" style={{ marginLeft: 6 }}>
              {speciesType || "default"}
            </span>
          </div>
        </div>
      </div>

      <div className="panelBody panelBody--map">
        <WorldMap
          geojsonUrl={geojsonUrl}
          onCountryClick={onCountryClick}
          selectedIso3={selectedIso3}
          languageRange={languageRange}
          valueByIso3={mapIntensityByIso3}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}