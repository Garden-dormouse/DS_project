import React, { useMemo } from "react";
import "./panel.css";

export default function FiltersPanel({ languages, species, query, onChange }) {
  const selectedSpecies = useMemo(
    () => species.find((s) => s.id === query.speciesId),
    [species, query.speciesId]
  );

  function setField(patch) {
    onChange((prev) => ({ ...prev, ...patch }));
  }

  // ✅ single-select main language
  function selectLanguage(code) {
    setField({ languageCode: code });
  }

  // ✅ add current main language to compare list
  function addLanguageToCompare() {
    const code = query.languageCode;
    if (!code) return;

    const set = new Set(query.compareLanguages || []);
    set.add(code);

    setField({ compareLanguages: Array.from(set) });
  }

  function removeCompareLanguage(code) {
    const next = (query.compareLanguages || []).filter((c) => c !== code);
    setField({ compareLanguages: next });
  }

  return (
    <div className="panelInner">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Filters</div>
          <div className="panelSubtitle">Pick species, language, and time range</div>
        </div>
      </div>

      <div className="panelBody">
        {/* Species */}
        <div className="field">
          <label className="label">Species</label>
          <select
            className="control"
            value={query.speciesId}
            onChange={(e) => setField({ speciesId: Number(e.target.value) })}
          >
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.latin_name}
              </option>
            ))}
          </select>
          <div className="hint">
            Selected: <span className="mono">{selectedSpecies?.latin_name}</span>
          </div>
        </div>

        {/* Language (single) + compare */}
        <div className="field">
          <label className="label">Language</label>

          <div className="chips">
            {languages.map((l) => {
              const active = query.languageCode === l.code;
              return (
                <button
                  key={l.code}
                  className={`chip ${active ? "chip--active" : ""}`}
                  onClick={() => selectLanguage(l.code)}
                  type="button"
                  title={l.name}
                >
                  {l.code}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button className="btn btn--primary" type="button" onClick={addLanguageToCompare}>
              Add language to compare
            </button>
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            Compare list (click to remove):
          </div>

          <div className="chips" style={{ marginTop: 8 }}>
            {(query.compareLanguages || []).length === 0 ? (
              <div className="hint">No compare languages yet.</div>
            ) : (
              (query.compareLanguages || []).map((code) => (
                <button
                  key={code}
                  className="chip chip--active"
                  type="button"
                  title="Remove"
                  onClick={() => removeCompareLanguage(code)}
                >
                  {code} ×
                </button>
              ))
            )}
          </div>

          <div className="hint">
            Main language: <span className="mono">{query.languageCode}</span>
          </div>
        </div>

        {/* Time range */}
        <div className="fieldGrid">
          <div className="field">
            <label className="label">Start</label>
            <input
              className="control"
              type="date"
              value={query.timeRange.start}
              onChange={(e) =>
                setField({ timeRange: { ...query.timeRange, start: e.target.value } })
              }
            />
          </div>
          <div className="field">
            <label className="label">End</label>
            <input
              className="control"
              type="date"
              value={query.timeRange.end}
              onChange={(e) =>
                setField({ timeRange: { ...query.timeRange, end: e.target.value } })
              }
            />
          </div>
        </div>

        {/* Granularity + Metric */}
        <div className="fieldGrid">
          <div className="field">
            <label className="label">Granularity</label>
            <select
              className="control"
              value={query.granularity}
              onChange={(e) => setField({ granularity: e.target.value })}
            >
              <option value="day">day</option>
              <option value="week">week</option>
              <option value="month">month</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Metric</label>
            <select
              className="control"
              value={query.metric}
              onChange={(e) => setField({ metric: e.target.value })}
            >
              <option value="pageviews">pageviews</option>
              <option value="log">log(pageviews)</option>
              <option value="growth">growth</option>
            </select>
          </div>
        </div>

        <div className="divider" />

        {/* Actions */}
        <div className="actions">
          <button
            className="btn"
            type="button"
            onClick={() =>
              onChange({
                speciesId: species[0].id,
                languageCode: "en",
                compareLanguages: [],
                timeRange: { start: "2024-01-01", end: "2024-12-31" },
                granularity: "month",
                metric: "pageviews",
              })
            }
          >
            Reset
          </button>

          <button className="btn btn--primary" type="button" onClick={() => {}}>
            Apply (mock)
          </button>
        </div>

        <div className="note">
          Tip: Choose a main language, then click “Add language to compare” to build a compare set
          for multi-line charts later.
        </div>
      </div>
    </div>
  );
}
