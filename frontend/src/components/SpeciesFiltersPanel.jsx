import { useMemo, useState } from "react";
import "./panel.css";

export default function SpeciesFiltersPanel({
  speciesList,
  selectedSpeciesId,
  onSelectSpeciesId,
  speciesTypes,
  selectedSpeciesType,
  onSelectSpeciesType,
}) {
  const [search, setSearch] = useState("");

  const filteredSpecies = useMemo(() => {
    const q = search.trim().toLowerCase();

    return speciesList.filter((s) => {
      const matchesSearch =
        !q || String(s.latin_name || "").toLowerCase().includes(q);

      const matchesType =
        !selectedSpeciesType || String(s.type || "") === selectedSpeciesType;

      return matchesSearch && matchesType;
    });
  }, [speciesList, search, selectedSpeciesType]);

  const selectedSpecies =
    speciesList.find((s) => s.id === selectedSpeciesId) || null;

  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Species Selection</div>
          <div className="panelSubtitle">
            Choose one species and inspect which languages view it the most
          </div>
        </div>
      </div>

      <div className="panelBody">
        <div className="field">
          <label className="label">Search Species</label>
          <input
            className="control"
            type="text"
            placeholder="Type a Latin name, e.g. Panthera leo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            {selectedSpeciesType
              ? `Selected type: ${selectedSpeciesType}`
              : "No species type filter"}
          </div>
        </div>

        <div className="field">
          <label className="label">Select Species</label>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {filteredSpecies.map((s) => {
              const checked = selectedSpeciesId === s.id;

              return (
                <label
                  key={s.id}
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
                    type="radio"
                    name="selected-species"
                    checked={checked}
                    onChange={() => onSelectSpeciesId(s.id)}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.latin_name}</div>
                    <div className="hint" style={{ marginTop: 2 }}>
                      id: {s.id} · {s.type || "unknown"}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            {selectedSpecies ? (
              <>
                Selected: <span className="mono">{selectedSpecies.latin_name}</span>
              </>
            ) : (
              "No species selected"
            )}
          </div>

          <div className="hint" style={{ marginTop: 6 }}>
            Showing {filteredSpecies.length} / {speciesList.length} species
          </div>
        </div>
      </div>
    </div>
  );
}