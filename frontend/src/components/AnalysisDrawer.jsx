import MiniSparkline from "./MiniSparkline.jsx";
import "./panel.css";

export default function AnalysisDrawer({
  isOpen,
  species,
  selectedLanguages,
  selectedRangeLabel,
  timeseries,
  timeseriesLoading,
  topSpeciesTimeseries,
  analysisLoading,
  onClose,
  accentColor = "#60A5FA",
}) {
  if (!isOpen) return null;

  const languageNames = Array.isArray(selectedLanguages)
    ? selectedLanguages.map((l) => l.name)
    : [];

  const languageLabel =
    languageNames.length === 0
      ? "No language selected"
      : languageNames.length <= 4
      ? languageNames.join(", ")
      : `${languageNames.length} languages selected`;

  const analysisText = species
    ? `${species.latin_name} is currently selected in the main panel. Below, the drawer shows the monthly pageview trends for all species currently in the Top 20 ranking, based on the selected languages and time range.`
    : `This drawer shows the monthly pageview trends for all species currently in the Top 20 ranking, based on the selected languages and time range.`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.38)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(50vw, 760px)",
          minWidth: "420px",
          height: "100vh",
          background: "linear-gradient(180deg, rgba(17,24,39,0.98), rgba(10,14,24,0.98))",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.35)",
          overflowY: "auto",
          padding: "20px 20px 28px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
              Top 20 Species Analysis
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Languages: <span className="mono">{languageLabel}</span>
            </div>
            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Range: <span className="mono">{selectedRangeLabel || "All Months"}</span>
            </div>
            {species?.latin_name && (
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
                Current selection: <span className="mono">{species.latin_name}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ flex: "0 0 auto", minWidth: 90 }}
          >
            Close
          </button>
        </div>

        <div
          className="card"
          style={{
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Overview</div>
              <div className="cardSubtitle">
                Summary for the current selection
              </div>
            </div>
          </div>

          <div className="cardBody" style={{ lineHeight: 1.65, color: "rgba(255,255,255,0.84)" }}>
            <p style={{ marginTop: 0 }}>{analysisText}</p>
            <p>
              Each card below represents one species from the current Top 20 list.
              The sparkline shows how attention changed month by month across the selected
              languages. This makes it easier to compare long-term patterns, peaks, and
              relative stability between species.
            </p>
            <p style={{ marginBottom: 0 }}>
              In general, species with sharp spikes may reflect temporary attention,
              while smoother curves suggest more stable interest over time.
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Selected Species Timeseries</div>
              <div className="cardSubtitle">
                Current single-species view from the main panel
              </div>
            </div>
          </div>

          <div className="cardBody">
            {timeseriesLoading ? (
              <div className="note">Loading selected species timeseries...</div>
            ) : !timeseries || timeseries.length === 0 ? (
              <div className="note">No selected-species timeseries data found.</div>
            ) : (
              <>
                <MiniSparkline
                  color={accentColor}
                  points={timeseries.map((row) => ({
                    label: row.month,
                    value: row.pageviews,
                  }))}
                />
                <div className="hint" style={{ marginTop: 10 }}>
                  {timeseries[0]?.month} → {timeseries[timeseries.length - 1]?.month}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Top 20 Species Timeseries</div>
              <div className="cardSubtitle">
                Monthly pageviews for each top species across the selected languages
              </div>
            </div>
          </div>

          <div className="cardBody">
            {analysisLoading ? (
              <div className="note">Loading Top 20 species timeseries...</div>
            ) : !topSpeciesTimeseries || topSpeciesTimeseries.length === 0 ? (
              <div className="note">No timeseries data found for the current Top 20 species.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {topSpeciesTimeseries.map((item, index) => (
                  <div
                    key={item.id ?? `${item.latin_name}-${index}`}
                    className="card"
                    style={{
                      marginBottom: 0,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="cardHeader">
                      <div style={{ minWidth: 0 }}>
                        <div className="cardTitle">
                          #{index + 1} {item.latin_name}
                        </div>
                        <div className="cardSubtitle">
                          Total pageviews:{" "}
                          <span className="mono">{formatNumber(item.totalPageviews)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cardBody">
                      {!item.timeseries || item.timeseries.length === 0 ? (
                        <div className="note">No timeseries data for this species.</div>
                      ) : (
                        <>
                          <MiniSparkline
                            color={accentColor}
                            points={item.timeseries.map((row) => ({
                              label: row.month,
                              value: row.pageviews,
                            }))}
                          />
                          <div className="hint" style={{ marginTop: 8 }}>
                            {item.timeseries[0]?.month} →{" "}
                            {item.timeseries[item.timeseries.length - 1]?.month}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n || 0));
}