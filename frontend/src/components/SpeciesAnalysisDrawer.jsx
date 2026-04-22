import MiniSparkline from "./MiniSparkline.jsx";
import "./panel.css";

export default function SpeciesAnalysisDrawer({
  isOpen,
  species,
  selectedRangeLabel,
  aggregateTimeseries,
  aggregateTimeseriesLoading,
  topLanguageTimeseries,
  analysisLoading,
  selectedLanguageCode,
  onClose,
  accentColor = "#60A5FA",
}) {
  if (!isOpen) return null;

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
              Species Language Analysis
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Species: <span className="mono">{species?.latin_name || "none"}</span>
            </div>
            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Range: <span className="mono">{selectedRangeLabel || "All Months"}</span>
            </div>
            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Current language selection:{" "}
              <span className="mono">{selectedLanguageCode || "overall trend"}</span>
            </div>
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

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Overall Timeseries</div>
              <div className="cardSubtitle">
                Aggregated monthly pageviews across all Top 20 languages
              </div>
            </div>
          </div>

          <div className="cardBody">
            {aggregateTimeseriesLoading ? (
              <div className="note">Loading overall timeseries...</div>
            ) : !aggregateTimeseries || aggregateTimeseries.length === 0 ? (
              <div className="note">No overall timeseries data found.</div>
            ) : (
              <>
                <MiniSparkline
                  color={accentColor}
                  points={aggregateTimeseries.map((row) => ({
                    label: row.month,
                    value: row.pageviews,
                  }))}
                />
                <div className="hint" style={{ marginTop: 8 }}>
                  {aggregateTimeseries[0]?.month} →{" "}
                  {aggregateTimeseries[aggregateTimeseries.length - 1]?.month}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Top 20 Language Timeseries</div>
              <div className="cardSubtitle">
                One chart per language for the selected species
              </div>
            </div>
          </div>

          <div className="cardBody">
            {analysisLoading ? (
              <div className="note">Loading language timeseries...</div>
            ) : !topLanguageTimeseries || topLanguageTimeseries.length === 0 ? (
              <div className="note">No language timeseries data found.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {topLanguageTimeseries.map((item, index) => (
                  <div
                    key={`${item.code}-${index}`}
                    className="card"
                    style={{
                      marginBottom: 0,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="cardHeader">
                      <div style={{ minWidth: 0 }}>
                        <div className="cardTitle">
                          #{index + 1} {item.name}
                        </div>
                        <div className="cardSubtitle">
                          code: <span className="mono">{item.code}</span> · total pageviews:{" "}
                          <span className="mono">{formatNumber(item.totalPageviews)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cardBody">
                      {!item.timeseries || item.timeseries.length === 0 ? (
                        <div className="note">No timeseries data for this language.</div>
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