import React from "react";
import "./panel.css";
import WorldMap from "../WorldMap.jsx";

export default function MapPanel({
  selectedIso3,
  highlightedCountries,
  onCountryClick,
  mapIntensityByIso3,
  geojsonUrl,
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
  availableMonths,
}) {
  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Language Activity Map</div>
          <div className="panelSubtitle">
            {startMonth && endMonth
              ? `Viewing: ${startMonth} → ${endMonth}`
              : "Viewing: monthly range"}
          </div>
        </div>

        <div className="rightPills" style={{ gap: 8, flexWrap: "wrap" }}>
          <select
            className="control control--compact"
            value={startMonth || ""}
            onChange={(e) => onStartMonthChange(e.target.value)}
            style={{ fontSize: 11, minWidth: 120 }}
          >
            <option value="">Start month</option>
            {availableMonths.map((month) => (
              <option key={`start-${month}`} value={month}>
                {month}
              </option>
            ))}
          </select>

          <select
            className="control control--compact"
            value={endMonth || ""}
            onChange={(e) => onEndMonthChange(e.target.value)}
            style={{ fontSize: 11, minWidth: 120 }}
          >
            <option value="">End month</option>
            {availableMonths.map((month) => (
              <option key={`end-${month}`} value={month}>
                {month}
              </option>
            ))}
          </select>

          <div className="miniPill">
            Selected: <span className="mono">{selectedIso3 ?? "none"}</span>
          </div>
        </div>
      </div>

      <div className="panelBody panelBody--map">
        <WorldMap
          geojsonUrl={geojsonUrl}
          onCountryClick={onCountryClick}
          selectedIso3={selectedIso3}
          highlightedCountries={highlightedCountries}
          valueByIso3={mapIntensityByIso3}
        />
      </div>
    </div>
  );
}