BEGIN;

CREATE TABLE Species (
    ID SERIAL PRIMARY KEY,
    Latin_name TEXT NOT NULL UNIQUE,
    Type TEXT
);

CREATE TABLE Languages (
    ID SERIAL PRIMARY KEY,
    Name TEXT NOT NULL UNIQUE,
    ISO_639_3 TEXT UNIQUE,
    Language_Range TEXT
);

CREATE TABLE Timestamps (
    ID SERIAL PRIMARY KEY,
    Time TIMESTAMP NOT NULL UNIQUE
);

CREATE TABLE Pageviews (
    ID SERIAL PRIMARY KEY,
    Timestamp_ID INTEGER NOT NULL,
    Language_ID INTEGER NOT NULL,
    Number_of_Pageviews INTEGER NOT NULL,
    Species_ID INTEGER NOT NULL,

    UNIQUE(Timestamp_ID, Language_ID, Species_ID),

    FOREIGN KEY (Timestamp_ID) REFERENCES Timestamps(ID),
    FOREIGN KEY (Language_ID) REFERENCES Languages(ID),
    FOREIGN KEY (Species_ID) REFERENCES Species(ID)
);


CREATE INDEX idx_pageviews_timestamp ON Pageviews(Timestamp_ID);
CREATE INDEX idx_pageviews_language ON Pageviews(Language_ID);
CREATE INDEX idx_pageviews_species ON Pageviews(Species_ID);
CREATE INDEX idx_pageviews_combined ON Pageviews(Timestamp_ID, Language_ID, Species_ID);

COMMIT;