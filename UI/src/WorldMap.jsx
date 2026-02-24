import React, { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";

// Expect GeoJSON features with properties:
// - iso_a3 / ISO_A3 / ADM0_A3 (varies by dataset)
// - name / NAME / ADMIN (varies)
//
// If your geojson uses different keys, tweak getIso3/getName.

export default function WorldMap({
  geojsonUrl = "/data/world.geojson",
  onCountryClick,
  selectedIso3,
  valueByIso3 = {},
}) {
  const width = 1200;
  const height = 640;

  const [countries, setCountries] = useState([]);
  const [error, setError] = useState("");
  const [hover, setHover] = useState(null); // { name, iso3, x, y, value }

  useEffect(() => {
    let alive = true;
    setError("");
    fetch(geojsonUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${geojsonUrl} (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (!alive) return;
        setCountries(data.features ?? []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e.message ?? e));
        setCountries([]);
      });

    return () => {
      alive = false;
    };
  }, [geojsonUrl]);

  const projection = useMemo(() => {
    if (!countries.length) return null;
    return geoNaturalEarth1().fitSize(
      [width, height],
      { type: "FeatureCollection", features: countries }
    );
  }, [countries]);

  const path = useMemo(() => {
    if (!projection) return null;
    return geoPath(projection);
  }, [projection]);

  const maxValue = useMemo(() => {
    const vals = Object.values(valueByIso3);
    if (!vals.length) return 1;
    return Math.max(1, ...vals);
  }, [valueByIso3]);

  function getIso3(feature) {
    const p = feature.properties || {};
    return p.iso_a3 || p.ISO_A3 || p.ADM0_A3 || p.ISO3 || null;
  }

  function getName(feature) {
    const p = feature.properties || {};
    return p.name || p.NAME || p.ADMIN || "Unknown";
  }

  function fillForIso3(iso3) {
    if (!iso3) return "rgba(255,255,255,0.03)";
    const v = valueByIso3[iso3] ?? 0;
    const t = Math.min(1, v / maxValue);
    // use alpha only (avoid choosing "specific colors" beyond basic readability)
    const a = 0.06 + 0.30 * t;
    return `rgba(96, 165, 250, ${a})`;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {!countries.length && (
        <div style={{ padding: 14, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
          {error ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Map data not loaded</div>
              <div className="mono">{error}</div>
              <div style={{ marginTop: 10 }}>
                Put your geojson at <span className="mono">public/data/world.geojson</span> (or change geojsonUrl).
              </div>
            </>
          ) : (
            <>Loading map…</>
          )}
        </div>
      )}

      {countries.length > 0 && projection && path && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          style={{ display: "block" }}
        >
          <rect x="0" y="0" width={width} height={height} fill="rgba(255,255,255,0.01)" />
          {countries.map((feature, idx) => {
            const d = path(feature);
            const iso3 = getIso3(feature);
            const name = getName(feature);
            const isSelected = iso3 && selectedIso3 === iso3;

            return (
              <path
                key={idx}
                d={d}
                fill={fillForIso3(iso3)}
                stroke={isSelected ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.10)"}
                strokeWidth={isSelected ? 1.6 : 0.8}
                onMouseMove={(e) => {
                  const v = iso3 ? (valueByIso3[iso3] ?? 0) : 0;
                  setHover({ name, iso3, x: e.clientX, y: e.clientY, value: v });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => iso3 && onCountryClick?.(iso3)}
                style={{ cursor: iso3 ? "pointer" : "default" }}
              />
            );
          })}
        </svg>
      )}

      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 12,
            top: hover.y + 12,
            pointerEvents: "none",
            background: "rgba(17,24,39,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "10px 10px",
            color: "rgba(255,255,255,0.92)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            width: 220,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>{hover.name}</div>
          <div style={{ color: "rgba(255,255,255,0.60)" }}>
            ISO3: <span className="mono">{hover.iso3 ?? "—"}</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.60)", marginTop: 6 }}>
            (mock) intensity: <span className="mono">{Math.round(hover.value)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
