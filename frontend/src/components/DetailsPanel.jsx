import "./panel.css";
import MiniSparkline from "./MiniSparkline.jsx";
import { getTypeColor } from "../utils/constants.js";

export default function DetailsPanel({
  selectedLanguages,
  topSpecies,
  selectedSpecies,
  onSelectSpecies,
  timeseries,
  timeseriesLoading,
  onOpenAnalysis,
  accentColor = "#60A5FA",
}) {
  const languageNames = Array.isArray(selectedLanguages)
    ? selectedLanguages.map((l) => l.name)
    : [];

  const languageLabel =
    languageNames.length === 0
      ? null
      : languageNames.length <= 3
      ? languageNames.join(", ")
      : `${languageNames.length} languages selected`;

  const timeseriesTitle = selectedSpecies
    ? `Timeseries: ${selectedSpecies.latin_name}`
    : "Timeseries: Total views";

  const timeseriesSubtitle = selectedSpecies
    ? "Showing the selected species across the chosen languages"
    : "Showing total views across the chosen languages";

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
          <div className="panelTitle">Top Species by Language</div>
          <div className="panelSubtitle">
            {languageLabel ? (
              <>Click a species to view its timeseries</>
            ) : (
              <>Select one or more languages</>
            )}
          </div>
        </div>
      </div>

      <div
        className="panelBody"
        style={{
          display: "grid",
          gridTemplateRows: languageLabel ? "auto auto" : "1fr",
          gap: 8,
          minHeight: 0,
          paddingTop: 8,
        }}
      >
        {!languageLabel ? (
          <div className="note" style={{ padding: "2rem", textAlign: "center" }}>
            Select one or more languages to view species data.
          </div>
        ) : (
          <>
            {topSpecies.length === 0 ? (
              <div className="note" style={{ padding: "2rem", textAlign: "center" }}>
                No species data found for the selected languages and time range.
              </div>
            ) : (
              <div
                className="card"
                style={{
                  alignSelf: "start",
                }}
              >
                <div className="cardHeader" style={{ padding: "10px 12px" }}>
                  <div>
                    <div className="cardTitle">Top 20 Species</div>
                    <div className="cardSubtitle">
                      Click a species to update the timeseries
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
                    {topSpecies.map((row, idx) => {
                      const speciesColor = getTypeColor(row.type, accentColor);

                      const isSelected =
                        selectedSpecies &&
                        (selectedSpecies.id === row.id ||
                          selectedSpecies.latin_name === row.latin_name);

                      return (
                        <li
                          key={row.id ?? `${row.latin_name}-${idx}`}
                          className="listItem"
                          onClick={() => onSelectSpecies(isSelected ? null : row)}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? `${speciesColor}1A` : "transparent",
                            borderRadius: 10,
                            paddingTop: 8,
                            paddingBottom: 8,
                            borderLeft: `4px solid ${speciesColor}`,
                          }}
                        >
                          <div
                            className="rank"
                            style={{
                              background: `${speciesColor}22`,
                              border: `1px solid ${speciesColor}55`,
                              color: "rgba(255,255,255,0.92)",
                            }}
                          >
                            {idx + 1}
                          </div>

                          <div className="listMain">
                            <div className="listTitle">{row.latin_name}</div>
                            <div className="listSubtitle">
                              species_id: <span className="mono">{row.id}</span>
                              {row.type ? (
                                <>
                                  {" "}
                                  · type:{" "}
                                  <span
                                    className="mono"
                                    style={{
                                      color: speciesColor,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {row.type}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div
                            className="listValue"
                            style={{
                              color: speciesColor,
                              fontWeight: 700,
                            }}
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

            <div
              className="card"
              style={{
                alignSelf: "start",
                marginTop: 0,
              }}
            >
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
                  onClick={() => onOpenAnalysis(selectedSpecies)}
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
                      color={
                        selectedSpecies?.type
                          ? getTypeColor(selectedSpecies.type, accentColor)
                          : accentColor
                      }
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