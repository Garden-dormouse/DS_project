BEGIN;

-- Pre-aggregated monthly pageviews by language and species type.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_language_pageviews AS
SELECT
    l.iso_639_3 AS language_code,
    t.time AS month,
    s.type AS species_type,
    SUM(p.number_of_pageviews) AS total_pageviews
FROM pageviews p
JOIN languages l ON p.language_id = l.id
JOIN timestamps t ON p.timestamp_id = t.id
JOIN species s ON p.species_id = s.id
WHERE l.iso_639_3 IS NOT NULL
GROUP BY l.iso_639_3, t.time, s.type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_lang_pv_unique
    ON mv_monthly_language_pageviews(language_code, month, species_type);
CREATE INDEX IF NOT EXISTS idx_mv_lang_pv_month
    ON mv_monthly_language_pageviews(month);
CREATE INDEX IF NOT EXISTS idx_mv_lang_pv_type
    ON mv_monthly_language_pageviews(species_type);

-- Pre-aggregated monthly pageviews by species, language, and month.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_species_pageviews AS
SELECT
    s.id AS species_id,
    s.latin_name,
    s.type AS species_type,
    l.iso_639_3 AS language_code,
    l.name AS language_name,
    t.time AS month,
    SUM(p.number_of_pageviews) AS total_pageviews
FROM pageviews p
JOIN species s ON p.species_id = s.id
JOIN languages l ON p.language_id = l.id
JOIN timestamps t ON p.timestamp_id = t.id
WHERE l.iso_639_3 IS NOT NULL
GROUP BY s.id, s.latin_name, s.type, l.iso_639_3, l.name, t.time;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sp_pv_unique
    ON mv_monthly_species_pageviews(species_id, language_code, month);
CREATE INDEX IF NOT EXISTS idx_mv_sp_pv_lang
    ON mv_monthly_species_pageviews(language_code);
CREATE INDEX IF NOT EXISTS idx_mv_sp_pv_species
    ON mv_monthly_species_pageviews(species_id);
CREATE INDEX IF NOT EXISTS idx_mv_sp_pv_month
    ON mv_monthly_species_pageviews(month);
CREATE INDEX IF NOT EXISTS idx_mv_sp_pv_type
    ON mv_monthly_species_pageviews(species_type);

COMMIT;
