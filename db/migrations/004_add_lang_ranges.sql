BEGIN TRANSACTION;

ALTER TABLE Languages
DROP COLUMN Glottocode;

ALTER TABLE Languages
ADD COLUMN Language_Range TEXT;

PRAGMA user_version = 4;

COMMIT;