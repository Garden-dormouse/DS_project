import MiniSparkline from "./MiniSparkline.jsx";
import "./panel.css";

export default function AnalysisDrawer({
  isOpen,
  species,
  selectedLanguages,
  selectedRangeLabel,
  timeseries,
  timeseriesLoading,
  onClose,
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
    ? `${species.latin_name} is currently selected from the ranking list. The chart shows how pageviews changed over the chosen time range and selected languages. You can use this panel to compare whether interest stayed stable, rose sharply, or had one or more peaks across time.`
    : `This panel shows the total pageview trend across the currently selected languages. It can be used to understand the overall attention pattern before focusing on one species.`;

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
              {species ? species.latin_name : "Overall analysis"}
            </div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Languages: <span className="mono">{languageLabel}</span>
            </div>
            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Range: <span className="mono">{selectedRangeLabel || "All Months"}</span>
            </div>
            {species?.id != null && (
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
                Species ID: <span className="mono">{species.id}</span>
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
              <div className="cardTitle">Image</div>
              <div className="cardSubtitle">
                Placeholder preview for the selected species
              </div>
            </div>
          </div>

          <div className="cardBody">
            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(135deg, rgba(96,165,250,0.18), rgba(52,211,153,0.10), rgba(255,255,255,0.02))",
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.72)",
                fontSize: 18,
                fontWeight: 700,
                textAlign: "center",
                padding: 20,
              }}
            >
              {species ? `${species.latin_name} image area` : "Image area"}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Timeseries</div>
              <div className="cardSubtitle">
                {species
                  ? "Monthly pageviews for the selected species"
                  : "Monthly total pageviews across the chosen languages"}
              </div>
            </div>
          </div>

          <div className="cardBody">
            {timeseriesLoading ? (
              <div className="note">Loading timeseries...</div>
            ) : !timeseries || timeseries.length === 0 ? (
              <div className="note">No timeseries data found.</div>
            ) : (
              <>
                <MiniSparkline
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

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Analysis</div>
              <div className="cardSubtitle">
                Summary panel for presentation and interpretation
              </div>
            </div>
          </div>

          <div className="cardBody" style={{ lineHeight: 1.65, color: "rgba(255,255,255,0.84)" }}>
            <p style={{ marginTop: 0 }}>{analysisText}</p>
            <p>
              A useful reading strategy is to look for three things: the general trend,
              sudden spikes, and whether interest remains stable over a long period.
              These patterns help explain if a species receives continuous attention or
              only short bursts of interest.
            </p>
            <p style={{ marginBottom: 0 }}>
              This drawer can later be extended with a real animal image, country-level
              notes, or a short generated explanation based on the selected filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}