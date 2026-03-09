import { useMemo, useState } from "react";
import "./panel.css";

export default function FiltersPanel({ languages, selectedLanguage, onSelectLanguage }) {
  const [search, setSearch] = useState("");

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return languages;

    return languages.filter((l) => {
      const code = String(l.code || "").toLowerCase();
      const name = String(l.name || "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [languages, search]);

  const selectedLanguageObj =
    languages.find((l) => l.code === selectedLanguage) || null;

  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Language Selection</div>
          <div className="panelSubtitle">Choose a language to explore</div>
        </div>
      </div>

      <div className="panelBody">
        <div className="field">
          <label className="label">Search Language</label>
          <input
            className="control"
            type="text"
            placeholder="Type language name, e.g. English, Estonian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Select Language</label>

          <select
            className="control"
            value={selectedLanguage || ""}
            onChange={(e) => onSelectLanguage(e.target.value || null)}
          >
            <option value="">-- Select a language --</option>
            {filteredLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="hint" style={{ marginTop: 10 }}>
            {selectedLanguageObj ? (
              <>
                Selected: <span className="mono">{selectedLanguageObj.name}</span>
              </>
            ) : (
              <>No language selected</>
            )}
          </div>

          <div className="hint" style={{ marginTop: 6 }}>
            Showing {filteredLanguages.length} / {languages.length} languages
          </div>
        </div>
      </div>
    </div>
  );
}