import React from "react";
import "./panel.css";
import WorldMap from "../WorldMap.jsx";

export default function MapPanel({ 
  selectedIso3, 
  highlightedCountries,
  onCountryClick, 
  mapIntensityByIso3, 
  geojsonUrl,
  selectedMonth,
  onMonthChange,
  availableMonths 
}) {
  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Language Activity Map</div>
          <div className="panelSubtitle">
            {selectedMonth ? `Viewing: ${selectedMonth}` : "Viewing: All months (aggregated)"}
          </div>
        </div>

        <div className="rightPills" style={{ gap: 8 }}>
          <select
            className="control control--compact"
            value={selectedMonth || ""}
            onChange={(e) => onMonthChange(e.target.value || null)}
            style={{ fontSize: 11 }}
          >
            <option value="">All Months</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
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
