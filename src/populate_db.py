import glob
import json
import os
import pickle
from urllib.request import urlretrieve

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import text

from db_module.dao.language_dao import SQLAlchemyLanguageDAO
from db_module.dao.pageview_dao import SQLAlchemyPageviewDAO
from db_module.dao.species_dao import SQLAlchemySpeciesDAO
from db_module.dao.timestamp_dao import SQLAlchemyTimestampDAO
from db_module.engine import get_engine, get_session_factory
from services.language_service import LanguageService
from services.pageview_service import PageviewService
from services.species_service import SpeciesService
from services.timestamp_service import TimestampService

load_dotenv()

DB_URL = os.getenv("DB_URL")
engine = get_engine(DB_URL)
SessionFactory = get_session_factory(engine)

# Download and index GeoJSON
GEOJSON_URL = "https://raw.githubusercontent.com/Glottography/asher2007world/refs/heads/main/cldf/contemporary/languages.geojson"
GEOJSON_PATH = "./data_wrangling/languages.geojson"

urlretrieve(GEOJSON_URL, GEOJSON_PATH)

with open(GEOJSON_PATH, encoding="utf8") as f:
    geo = json.load(f)

# Build lookup: Glottocode -> list of features
geo_by_glottocode = {}
for feature in geo["features"]:
    g = feature["properties"].get("cldf:languageReference")
    if g:
        geo_by_glottocode.setdefault(g, []).append(feature)


def normalize_timestamp_key(value):
    """Normalize pandas/python/sqlite timestamps to one comparable string key."""
    if value is None:
        return None

    ts = pd.to_datetime(value, errors="coerce")
    if pd.isna(ts):
        return None

    return ts.strftime("%Y-%m-%d")


def drop_pageview_indexes(session):
    """Drop non-essential pageviews indexes before massive bulk load."""
    dialect_name = session.get_bind().dialect.name
    if dialect_name != "postgresql":
        print(f"Skipping index drop for dialect: {dialect_name}")
        return

    print("Dropping pageviews indexes before bulk load...")
    index_statements = [
        "DROP INDEX IF EXISTS idx_pageviews_timestamp",
        "DROP INDEX IF EXISTS idx_pageviews_language",
        "DROP INDEX IF EXISTS idx_pageviews_species",
        "DROP INDEX IF EXISTS idx_pageviews_combined",
        "DROP INDEX IF EXISTS idx_pageviews_optimized",
    ]
    for statement in index_statements:
        session.execute(text(statement))
    session.commit()


def create_pageview_indexes(session):
    """Recreate pageviews indexes after bulk load completes."""
    dialect_name = session.get_bind().dialect.name
    if dialect_name != "postgresql":
        print(f"Skipping index creation for dialect: {dialect_name}")
        return

    print("Recreating pageviews indexes after bulk load...")
    index_statements = [
        "CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON pageviews(timestamp_id)",
        "CREATE INDEX IF NOT EXISTS idx_pageviews_language ON pageviews(language_id)",
        "CREATE INDEX IF NOT EXISTS idx_pageviews_species ON pageviews(species_id)",
        "CREATE INDEX IF NOT EXISTS idx_pageviews_combined ON pageviews(timestamp_id, language_id, species_id)",
        "CREATE INDEX IF NOT EXISTS idx_pageviews_optimized ON pageviews(timestamp_id, language_id, species_id, number_of_pageviews)",
    ]
    for statement in index_statements:
        session.execute(text(statement))
    session.commit()


with SessionFactory() as session:
    species_dao = SQLAlchemySpeciesDAO(session)
    species_service = SpeciesService(species_dao)
    language_dao = SQLAlchemyLanguageDAO(session)
    language_service = LanguageService(language_dao)
    timestamp_dao = SQLAlchemyTimestampDAO(session)
    timestamp_service = TimestampService(timestamp_dao)
    pageview_dao = SQLAlchemyPageviewDAO(session)
    pageview_service = PageviewService(pageview_dao)

    # Example usage
    # species = species_service.add_species("Eliomys quercinus")
    # language = language_service.add_language("es")
    # timestamp = timestamp_service.add_timestamp(datetime.datetime.now())
    # pageview_service.add_pageview(
    #    timestamp_ID=timestamp.ID,
    #    language_ID=language.ID,
    #    species_ID=species.ID,
    #    number_of_pageviews=42,
    # )

    # Populating the database with data

    # Load all type-specific language files and concatenate
    print("Loading language data...")
    language_files = glob.glob("data_wrangling/df_languages_*.pkl")
    if language_files:
        df_languages_list = [pickle.load(open(f, "rb")) for f in language_files]
        df_languages = pd.concat(df_languages_list, ignore_index=True)
        # Remove duplicates based on language name
        df_languages = df_languages.drop_duplicates(subset=["language"], keep="first")
    else:
        print(
            "WARNING: No type-specific language files found. Looking for df_languages.pkl..."
        )
        with open(
            os.path.join(os.getcwd(), "data_wrangling", "df_languages.pkl"), "rb"
        ) as fileobject:
            df_languages = pickle.load(fileobject)

    def get_language_range(glottocode_string):
        """Combine polygons for all Glottocodes in semicolon-separated string"""
        if not glottocode_string:
            return None
        polygons = []
        for g in glottocode_string.split(";"):
            polygons.extend(geo_by_glottocode.get(g, []))
        if not polygons:
            return None
        return json.dumps({"type": "FeatureCollection", "features": polygons})

    # Remove duplicates based on language name
    df_languages = df_languages.drop_duplicates(subset=["language"], keep="first")
    # Also remove duplicates based on ISO code
    df_languages = df_languages.drop_duplicates(subset=["iso639_3"], keep="first")

    df_languages["language_range"] = df_languages["glottocode"].apply(
        get_language_range
    )
    # If no individual language range found, try macrolanguage range
    df_languages.loc[df_languages["language_range"].isna(), "language_range"] = \
        df_languages.loc[df_languages["language_range"].isna(), "macro_glottocode"].apply(
            get_language_range
        )

    language_rows = [
        (row["language"], row["iso639_3"], row["language_range"])
        for _, row in df_languages.iterrows()
    ]
    language_service.add_many_languages(language_rows)

    # Load all type-specific species files and concatenate
    print("Loading species data...")
    species_files = glob.glob("data_wrangling/df_species_*.pkl")
    if species_files:
        df_species_list = [pickle.load(open(f, "rb")) for f in species_files]
        df_species = pd.concat(df_species_list, ignore_index=True)
    else:
        print(
            "WARNING: No type-specific species files found. Looking for df_species.pkl..."
        )
        with open(
            os.path.join(os.getcwd(), "data_wrangling", "df_species.pkl"), "rb"
        ) as fileobject:
            df_species = pickle.load(fileobject)

    print(f"Inserting {len(df_species)} species into the database in a single batch")
    species_list = [
        (row["latin_name"], row["type"] if "type" in row.index else "unknown")
        for index, row in df_species.iterrows()
    ]
    species_service.add_many_species(species_list)

    with open(
        os.path.join(os.getcwd(), "data_wrangling", "df_time.pkl"), "rb"
    ) as fileobject:
        df_time = pickle.load(fileobject)
    timestamp_rows = [row["timestamp"] for _, row in df_time.iterrows()]
    timestamp_service.add_many_timestamps(timestamp_rows)

    all_languages = language_dao.get_all()
    language_lookup = {lang.name: lang.id for lang in all_languages}

    all_species = species_dao.get_all()
    species_lookup = {s.latin_name: s.id for s in all_species}

    all_timestamps = timestamp_dao.get_all()
    timestamp_lookup = {
        normalize_timestamp_key(t.time): t.id
        for t in all_timestamps
        if normalize_timestamp_key(t.time) is not None
    }

    # Load all type-specific pageview files and concatenate
    print("Loading pageview data...")
    pageview_files = glob.glob("data_wrangling/df_pageviews_*.pkl")
    if pageview_files:
        df_pageviews_list = [pickle.load(open(f, "rb")) for f in pageview_files]
        df_pageviews = pd.concat(df_pageviews_list, ignore_index=True)
    else:
        print(
            "WARNING: No type-specific pageview files found. Looking for df_pageviews.pkl..."
        )
        with open(
            os.path.join(os.getcwd(), "data_wrangling", "df_pageviews.pkl"), "rb"
        ) as fileobject:
            df_pageviews = pickle.load(fileobject)

    batch_size = int(os.getenv("PAGEVIEW_BATCH_SIZE", "1000000"))
    batch_count = len(df_pageviews) // batch_size + (len(df_pageviews) % batch_size > 0)
    print(f"Batch count: {batch_count}")
    print(
        f"Inserting {len(df_pageviews)} pageviews into the database in batches of {batch_size}"
    )
    drop_pageview_indexes(session)
    skipped_total = 0
    time_total = 0.0

    try:
        for k in range(batch_count):
            start_time = pd.Timestamp.now()
            start = k * batch_size
            end = min((k + 1) * batch_size, len(df_pageviews))
            batch_df = df_pageviews.iloc[start:end][
                ["language", "species", "timestamp", "number_of_pageviews"]
            ].copy()

            batch_df["language_id"] = batch_df["language"].map(language_lookup)
            batch_df["species_id"] = batch_df["species"].map(species_lookup)

            parsed_ts = pd.to_datetime(batch_df["timestamp"], errors="coerce")
            batch_df["timestamp_key"] = parsed_ts.dt.strftime("%Y-%m-%d")
            batch_df.loc[parsed_ts.isna(), "timestamp_key"] = None
            batch_df["timestamp_id"] = batch_df["timestamp_key"].map(timestamp_lookup)

            valid_rows = batch_df.dropna(
                subset=["language_id", "species_id", "timestamp_id", "number_of_pageviews"]
            )
            skipped_rows = len(batch_df) - len(valid_rows)
            skipped_total += skipped_rows

            if valid_rows.empty:
                print(f"Skipped batch {k}: no valid rows in range {start} to {end - 1}")
                continue

            pageviews_list = [
                (
                    int(timestamp_id),
                    int(language_id),
                    int(species_id),
                    int(number_of_pageviews),
                )
                for timestamp_id, language_id, species_id, number_of_pageviews in valid_rows[
                    [
                        "timestamp_id",
                        "language_id",
                        "species_id",
                        "number_of_pageviews",
                    ]
                ].itertuples(index=False, name=None)
            ]

            pageview_service.add_many_pageviews(pageviews_list)
            end_time = pd.Timestamp.now()
            batch_time = (end_time - start_time).total_seconds()
            time_total += batch_time
            print(
                f"Inserted batch {k + 1}/{batch_count}: rows {start} to {end - 1}, inserted {len(pageviews_list)}, skipped {skipped_rows}, batch time: {batch_time:.2f}s"
            )
    finally:
        start_time = pd.Timestamp.now()
        create_pageview_indexes(session)
        end_time = pd.Timestamp.now()
        index_time = (end_time - start_time).total_seconds()
        time_total += index_time
        print(f"Time for creating pageview indexes: {index_time:.2f}s")

    print(f"Total skipped pageview rows: {skipped_total}")
    print(f"Total time for inserting pageviews: {time_total:.2f}s")

    # Refresh materialized views after all data is loaded
    print("Refreshing materialized views...")
    start_time = pd.Timestamp.now()
    session.execute(
        text("REFRESH MATERIALIZED VIEW mv_monthly_language_pageviews")
    )
    end_time = pd.Timestamp.now()
    materialized_view_time = (end_time - start_time).total_seconds()
    print(f"Time for refreshing mv_monthly_language_pageviews: {materialized_view_time:.2f}s")
    start_time = pd.Timestamp.now()
    session.execute(
        text("REFRESH MATERIALIZED VIEW mv_monthly_species_pageviews")
    )
    end_time = pd.Timestamp.now()
    materialized_view_time = (end_time - start_time).total_seconds()
    print(f"Time for refreshing mv_monthly_species_pageviews: {materialized_view_time:.2f}s")
    session.commit()
    print("Materialized views refreshed.")
