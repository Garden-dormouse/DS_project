BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_species_latin_name_trgm
    ON species USING gin (latin_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_species_type_latin_name
    ON species(type, latin_name, id);

COMMIT;