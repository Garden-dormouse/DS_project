BEGIN;

-- Index on species type for filtering by species type in queries
CREATE INDEX IF NOT EXISTS idx_species_type ON species(type);

CREATE INDEX IF NOT EXISTS idx_pageviews_optimized 
  ON pageviews(timestamp_id, language_id, species_id, number_of_pageviews);

COMMIT;



