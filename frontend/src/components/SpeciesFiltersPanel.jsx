import { useDeferredValue, useEffect, useMemo, useState } from "react";
import "./panel.css";
import { api } from "../services/api.js";
import { PAGE_SIZE } from "../utils/constants.js";

export default function SpeciesFiltersPanel({
  selectedSpecies,
  onSelectSpecies,
  speciesTypes,
  selectedSpeciesType,
  onSelectSpeciesType,
}) {
  const [search, setSearch] = useState("");
  const [speciesResults, setSpeciesResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    let ignore = false;

    async function loadFirstPage() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.getSpecies({
          query: deferredSearch || null,
          speciesType: selectedSpeciesType,
          limit: PAGE_SIZE,
          offset: 0,
        });

        if (ignore) return;

        setSpeciesResults(Array.isArray(response.items) ? response.items : []);
        setHasMore(Boolean(response.has_more));
      } catch (err) {
        if (ignore) return;
        setSpeciesResults([]);
        setHasMore(false);
        setError(err.message || "Failed to search species");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFirstPage();

    return () => {
      ignore = true;
    };
  }, [deferredSearch, selectedSpeciesType]);

  const visibleSpecies = useMemo(() => {
    if (!selectedSpecies) {
      return speciesResults;
    }

    const alreadyVisible = speciesResults.some((species) => species.id === selectedSpecies.id);
    if (alreadyVisible) {
      return speciesResults;
    }

    const normalizedQuery = deferredSearch.toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      String(selectedSpecies.latin_name || "").toLowerCase().includes(normalizedQuery);
    const matchesType =
      !selectedSpeciesType || String(selectedSpecies.type || "") === selectedSpeciesType;

    if (!matchesQuery || !matchesType) {
      return speciesResults;
    }

    return [selectedSpecies, ...speciesResults];
  }, [deferredSearch, selectedSpecies, selectedSpeciesType, speciesResults]);

  async function handleLoadMore() {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);

      const response = await api.getSpecies({
        query: deferredSearch || null,
        speciesType: selectedSpeciesType,
        limit: PAGE_SIZE,
        offset: speciesResults.length,
      });

      const nextItems = Array.isArray(response.items) ? response.items : [];
      setSpeciesResults((current) => [...current, ...nextItems]);
      setHasMore(Boolean(response.has_more));
    } catch (err) {
      setError(err.message || "Failed to load more species");
    } finally {
      setLoadingMore(false);
    }
  }

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
        </div>

        {selectedSpecies && (
          <div className="field">
            <button
              type="button"
              className="btn"
              style={{ width: "100%", background: "rgba(251, 113, 133, 0.1)", borderColor: "rgba(251, 113, 133, 0.3)" }}
              onClick={() => onSelectSpecies(null)}
            >
              Unselect Species
            </button>
          </div>
        )}

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
            {loading && visibleSpecies.length === 0 ? (
              <div className="note" style={{ padding: "1rem" }}>
                Searching species...
              </div>
            ) : visibleSpecies.length === 0 ? (
              <div className="note" style={{ padding: "1rem" }}>
                No species matched the current search.
              </div>
            ) : (
              visibleSpecies.map((s) => {
                const checked = selectedSpecies?.id === s.id;

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
                      onChange={() => onSelectSpecies(s)}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.latin_name}</div>
                      <div className="hint" style={{ marginTop: 2 }}>
                        id: {s.id} · {s.type || "unknown"}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {hasMore && (
            <button
              type="button"
              className="btn"
              style={{ marginTop: 10, width: "100%" }}
              onClick={handleLoadMore}
              disabled={loading || loadingMore}
            >
              {loadingMore ? "Loading more species..." : "Load more species"}
            </button>
          )}

          {error && (
            <div className="note" style={{ marginTop: 10 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}