import "./panel.css";

export default function DetailsPanel({
  selectedLanguage,
  topSpecies,
}) {
  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Top Species by Language</div>
          <div className="panelSubtitle">
            {selectedLanguage ? (
              <>
                Language: <span className="mono">{selectedLanguage}</span>
              </>
            ) : (
              <>Select a language</>
            )}
          </div>
        </div>
      </div>

      <div className="panelBody">
        {!selectedLanguage ? (
          <div className="note" style={{ padding: "2rem", textAlign: "center" }}>
            Select a language to view species data.
          </div>
        ) : topSpecies.length === 0 ? (
          <div className="note" style={{ padding: "2rem", textAlign: "center" }}>
            No species data found for this language.
          </div>
        ) : (
          <div className="card">
            <div className="cardHeader">
              <div>
                <div className="cardTitle">Top 20 Species</div>
              </div>
            </div>

            <div className="cardBody">
              <ul className="list">
                {topSpecies.map((row, idx) => (
                  <li key={row.id} className="listItem">
                    <div className="rank">{idx + 1}</div>
                    <div className="listMain">
                      <div className="listTitle">{row.latin_name}</div>
                      <div className="listSubtitle">
                        species_id: <span className="mono">{row.id}</span>
                      </div>
                    </div>
                    <div className="listValue">{formatNumber(row.pageviews)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}
