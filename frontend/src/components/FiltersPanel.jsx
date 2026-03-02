import "./panel.css";

export default function FiltersPanel({ languages, selectedLanguage, onSelectLanguage }) {
  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Language Selection</div>
          <div className="panelSubtitle">Choose a language to explore</div>
        </div>
      </div>

      <div className="panelBody">
        {/* Available languages */}
        <div className="field">
          <label className="label">Select Language</label>
          
          <select
            className="control"
            value={selectedLanguage || ""}
            onChange={(e) => onSelectLanguage(e.target.value || null)}
          >
            <option value="">-- Select a language --</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} - {l.name}
              </option>
            ))}
          </select>

          {selectedLanguage && (
            <div className="hint" style={{ marginTop: 10 }}>
              Selected: <span className="mono">{selectedLanguage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
