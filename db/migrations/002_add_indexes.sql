BEGIN TRANSACTION;

CREATE INDEX idx_pageviews_timestamp
ON Pageviews(Timestamp_ID);

CREATE INDEX idx_pageviews_language
ON Pageviews(Language_ID);

CREATE INDEX idx_pageviews_species
ON Pageviews(Species_ID);

CREATE INDEX idx_pageviews_combined
ON Pageviews(Timestamp_ID, Language_ID, Species_ID);

PRAGMA user_version = 2;

COMMIT;