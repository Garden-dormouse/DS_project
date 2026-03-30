import { useMemo, useState } from "react";
import "./panel.css";

export default function FiltersPanel({
  languages,
  selectedLanguages,
  onChangeSelectedLanguages,
  speciesTypes,
  selectedSpeciesType,
  onSelectSpeciesType,
}) {
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

  const selectedSet = useMemo(() => new Set(selectedLanguages), [selectedLanguages]);

  const selectedLanguageObjects = useMemo(() => {
    return languages.filter((l) => selectedSet.has(l.code));
  }, [languages, selectedSet]);

  function toggleLanguage(code) {
    if (selectedSet.has(code)) {
      onChangeSelectedLanguages(selectedLanguages.filter((c) => c !== code));
    } else {
      onChangeSelectedLanguages([...selectedLanguages, code]);
    }
  }

  function clearAllLanguages() {
    onChangeSelectedLanguages([]);
  }

  function selectVisibleLanguages() {
    const next = new Set(selectedLanguages);
    filteredLanguages.forEach((l) => next.add(l.code));
    onChangeSelectedLanguages(Array.from(next));
  }

  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Language Selection</div>
          <div className="panelSubtitle">Choose one or more languages and a species type to explore</div>
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
          <label className="label">Select Languages</label>

          <div className="actions" style={{ marginBottom: 10 }}>
            <button type="button" className="btn" onClick={selectVisibleLanguages}>
              Select Visible
            </button>
            <button type="button" className="btn" onClick={clearAllLanguages}>
              Clear All
            </button>
          </div>

          {selectedLanguageObjects.length > 0 && (
            <div className="chips" style={{ marginBottom: 10 }}>
              {selectedLanguageObjects.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className="chip chip--active"
                  onClick={() => toggleLanguage(l.code)}
                  title="Remove this language"
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {filteredLanguages.map((l) => {
              const checked = selectedSet.has(l.code);

              return (
                <label
                  key={l.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: checked ? "rgba(96,165,250,0.08)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLanguage(l.code)}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                    <div className="hint" style={{ marginTop: 2 }}>
                      {l.code}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            {selectedLanguageObjects.length > 0
              ? `Selected ${selectedLanguageObjects.length} language(s)`
              : "No language selected"}
          </div>

          <div className="hint" style={{ marginTop: 6 }}>
            Showing {filteredLanguages.length} / {languages.length} languages
          </div>
        </div>

        <div className="field">
          <label className="label">Species Type</label>
          <select
            className="control"
            value={selectedSpeciesType || ""}
            onChange={(e) => onSelectSpeciesType(e.target.value || null)}
          >
            <option value="">All species types</option>
            {speciesTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="hint" style={{ marginTop: 6 }}>
            {selectedSpeciesType ? `Selected type: ${selectedSpeciesType}` : "No species type filter"}
          </div>
        </div>
      </div>
    </div>
  );
}