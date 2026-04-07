import os
import pickle
import json
import glob
import pandas as pd

from dotenv import load_dotenv

from urllib.request import urlretrieve
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

    for index, row in df_languages.iterrows():
        language_service.add_language(
            row["language"], row["iso639_3"], row["language_range"]
        )

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

    for index, row in df_species.iterrows():
        # Pass species type - should exist in type-specific files, fallback to 'unknown'
        species_type = row["type"] if "type" in row.index else "unknown"
        species_service.add_species(row["latin_name"], species_type)

    with open(
        os.path.join(os.getcwd(), "data_wrangling", "df_time.pkl"), "rb"
    ) as fileobject:
        df_time = pickle.load(fileobject)
    for index, row in df_time.iterrows():
        timestamp_service.add_timestamp(row["timestamp"])

    all_languages = language_dao.get_all()
    language_lookup = {lang.name: lang.id for lang in all_languages}

    all_species = species_dao.get_all()
    species_lookup = {s.latin_name: s.id for s in all_species}

    all_timestamps = timestamp_dao.get_all()
    timestamp_lookup = {t.time: t.id for t in all_timestamps}

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

    for index, row in df_pageviews.iterrows():
        language_id = language_lookup.get(row["language"])  # Use lookup
        species_id = species_lookup.get(row["species"])  # Use lookup
        timestamp_id = timestamp_lookup.get(row["timestamp"])  # Use lookup

        pageview_service.add_pageview(
            timestamp_id=timestamp_id,
            language_id=language_id,
            species_id=species_id,
            number_of_pageviews=row["number_of_pageviews"],
        )

        if index == 20_000:  # Limit to first 20000 rows for testing
            break
