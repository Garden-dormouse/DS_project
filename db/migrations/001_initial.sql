PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE Species (
    ID INTEGER PRIMARY KEY,
    Latin_name TEXT NOT NULL
);

CREATE TABLE Languages (
    ID INTEGER PRIMARY KEY,
    Name TEXT NOT NULL
);

CREATE TABLE Timestamps (
    ID INTEGER PRIMARY KEY,
    Time DATETIME NOT NULL
);

CREATE TABLE Pageviews (
    ID INTEGER PRIMARY KEY,
    Timestamp_ID INTEGER NOT NULL,
    Language_ID INTEGER NOT NULL,
    Number_of_Pageviews INTEGER NOT NULL,
    Species_ID INTEGER NOT NULL,

    FOREIGN KEY (Timestamp_ID) REFERENCES Timestamps(ID),
    FOREIGN KEY (Language_ID) REFERENCES Languages(ID),
    FOREIGN KEY (Species_ID) REFERENCES Species(ID)
);

PRAGMA user_version = 1;

COMMIT;