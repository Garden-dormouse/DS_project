import React from "react";
import "./panel.css";
import WorldMap from "../WorldMap.jsx";

export default function MapPanel({ selectedIso3, onCountryClick, mapIntensityByIso3, geojsonUrl }) {
  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Overview</div>
          <div className="panelSubtitle">Click a country to drill down (prototype)</div>
        </div>

        <div className="rightPills">
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
          valueByIso3={mapIntensityByIso3}
        />
      </div>
    </div>
  );
}
