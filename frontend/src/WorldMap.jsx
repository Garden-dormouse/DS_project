import React, { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";

function hexToRgb(hex) {
  const safeHex = hex.replace("#", "");
  const normalized =
    safeHex.length === 3
      ? safeHex
          .split("")
          .map((c) => c + c)
          .join("")
      : safeHex;

  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function WorldMap({
  geojsonUrl = "/data/world.geojson",
  onCountryClick,
  selectedIso3,
  languageRange = null,
  valueByIso3 = {},
  accentColor = "#60A5FA",
}) {
  const width = 1200;
  const height = 640;

  const [countries, setCountries] = useState([]);
  const [error, setError] = useState("");
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(geojsonUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${geojsonUrl} (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (!alive) return;
        setError("");
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
    if (feature.id) return feature.id;
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
    const a = 0.06 + 0.30 * t;
    return rgbaFromHex(accentColor, a);
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

            const strokeColor = isSelected
              ? rgbaFromHex(accentColor, 0.95)
              : "rgba(255,255,255,0.10)";
            const strokeWidth = isSelected ? 1.8 : 0.8;

            return (
              <path
                key={idx}
                d={d}
                fill={fillForIso3(iso3)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                onMouseMove={(e) => {
                  const v = iso3 ? (valueByIso3[iso3] ?? 0) : 0;
                  setHover({ name, iso3, x: e.clientX, y: e.clientY, value: v });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (iso3 && onCountryClick) {
                    onCountryClick(iso3);
                  }
                }}
                style={{ cursor: iso3 ? "pointer" : "default" }}
              />
            );
          })}

          {languageRange && languageRange.features && path && projection && (
            languageRange.features.map((feature, idx) => {
              const d = path(feature);
              return (
                <path
                  key={`lang-range-${idx}`}
                  d={d}
                  fill={rgbaFromHex(accentColor, 0.14)}
                  stroke={rgbaFromHex(accentColor, 0.70)}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              );
            })
          )}
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
            Total pageviews: <span className="mono">{formatNumber(hover.value)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}