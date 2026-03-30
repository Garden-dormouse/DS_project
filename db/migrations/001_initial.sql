BEGIN;

CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    latin_name TEXT NOT NULL UNIQUE,
    type TEXT
);

CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    iso_639_3 TEXT UNIQUE,
    language_range TEXT
);

CREATE TABLE timestamps (
    id SERIAL PRIMARY KEY,
    time DATE NOT NULL UNIQUE
);

CREATE TABLE pageviews (
    id SERIAL PRIMARY KEY,
    timestamp_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    number_of_pageviews INTEGER NOT NULL,
    species_id INTEGER NOT NULL,

    UNIQUE(timestamp_id, language_id, species_id),

    FOREIGN KEY (timestamp_id) REFERENCES timestamps(id),
    FOREIGN KEY (language_id) REFERENCES languages(id),
    FOREIGN KEY (species_id) REFERENCES species(id)
);


CREATE INDEX idx_pageviews_timestamp ON pageviews(timestamp_id);
CREATE INDEX idx_pageviews_language ON pageviews(language_id);
CREATE INDEX idx_pageviews_species ON pageviews(species_id);
CREATE INDEX idx_pageviews_combined ON pageviews(timestamp_id, language_id, species_id);

COMMIT;