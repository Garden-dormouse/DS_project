import "./panel.css";
import MiniSparkline from "./MiniSparkline.jsx";

export default function SpeciesLanguagePanel({
  selectedSpecies,
  topLanguages,
  selectedLanguageCode,
  onSelectLanguageCode,
  timeseries,
  timeseriesLoading,
  onOpenAnalysis,
  accentColor = "#60A5FA",
}) {
  const selectedLanguage =
    topLanguages.find((row) => row.code === selectedLanguageCode) || null;

  const timeseriesTitle = selectedLanguage
    ? `Timeseries: ${selectedLanguage.name}`
    : "Timeseries: All selected languages";

  const timeseriesSubtitle = selectedLanguage
    ? "Monthly pageviews for the selected species in this language"
    : "Monthly total pageviews for the selected species across all Top 20 languages";

  return (
    <div
      className="panelInner"
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        minHeight: 0,
      }}
    >
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Top Languages by Species</div>
          <div className="panelSubtitle">
            {selectedSpecies ? (
              <>Click a language to view its timeseries</>
            ) : (
              <>Select one species</>
            )}
          </div>
        </div>
      </div>

      <div
        className="panelBody"
        style={{
          display: "grid",
          gridTemplateRows: selectedSpecies ? "auto auto" : "1fr",
          gap: 8,
          minHeight: 0,
          paddingTop: 8,
        }}
      >
        {!selectedSpecies ? (
          <div className="note" style={{ padding: "2rem", textAlign: "center" }}>
            Select a species to view the languages where it appears most.
          </div>
        ) : (
          <>
            {topLanguages.length === 0 ? (
              <div className="note" style={{ padding: "2rem", textAlign: "center" }}>
                No language data found for the selected species and time range.
              </div>
            ) : (
              <div className="card">
                <div className="cardHeader" style={{ padding: "10px 12px" }}>
                  <div>
                    <div className="cardTitle">Top 20 Languages</div>
                    <div className="cardSubtitle">
                      Click a language to update the timeseries. Click again to return to the overall trend.
                    </div>
                  </div>
                </div>

                <div
                  className="cardBody"
                  style={{
                    height: 220,
                    overflowY: "auto",
                    paddingRight: 6,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  <ul className="list">
                    {topLanguages.map((row, idx) => {
                      const isSelected = selectedLanguageCode === row.code;

                      return (
                        <li
                          key={`${row.code}-${idx}`}
                          className="listItem"
                          onClick={() =>
                            onSelectLanguageCode(isSelected ? null : row.code)
                          }
                          style={{
                            cursor: "pointer",
                            background: isSelected ? `${accentColor}1A` : "transparent",
                            borderRadius: 10,
                            paddingTop: 8,
                            paddingBottom: 8,
                            borderLeft: `4px solid ${accentColor}`,
                          }}
                        >
                          <div
                            className="rank"
                            style={{
                              background: `${accentColor}22`,
                              border: `1px solid ${accentColor}55`,
                            }}
                          >
                            {idx + 1}
                          </div>

                          <div className="listMain">
                            <div className="listTitle">{row.name}</div>
                            <div className="listSubtitle">
                              code: <span className="mono">{row.code}</span>
                            </div>
                          </div>

                          <div
                            className="listValue"
                            style={{ color: accentColor, fontWeight: 700 }}
                          >
                            {formatNumber(row.pageviews)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <div className="card" style={{ marginTop: 0 }}>
              <div
                className="cardHeader"
                style={{
                  padding: "10px 12px",
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="cardTitle">{timeseriesTitle}</div>
                  <div className="cardSubtitle">{timeseriesSubtitle}</div>
                </div>

                <button
                  type="button"
                  className="btn"
                  style={{ flex: "0 0 auto", minWidth: 130 }}
                  onClick={onOpenAnalysis}
                >
                  Open analysis
                </button>
              </div>

              <div className="cardBody" style={{ paddingTop: 10 }}>
                {timeseriesLoading ? (
                  <div className="note">Loading timeseries...</div>
                ) : !timeseries || timeseries.length === 0 ? (
                  <div className="note">No timeseries data found.</div>
                ) : (
                  <>
                    <MiniSparkline
                      color={accentColor}
                      points={timeseries.map((row) => ({
                        label: row.month,
                        value: row.pageviews,
                      }))}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n || 0));
}