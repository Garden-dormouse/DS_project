import os
import pickle

from dotenv import load_dotenv

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

DB_PATH = os.getenv("DB_PATH")

DB_URL = f"sqlite:///{DB_PATH}"
engine = get_engine(DB_URL)
SessionFactory = get_session_factory(engine)

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
    with open(
        os.path.join(os.getcwd(), "data_wrangling", "df_languages.pkl"), "rb"
    ) as fileobject:
        df_languages = pickle.load(fileobject)
    for index, row in df_languages.iterrows():
        language_service.add_language(
            row["language"], row["iso639_3"], row["glottocode"]
        )

    with open(
        os.path.join(os.getcwd(), "data_wrangling", "df_species.pkl"), "rb"
    ) as fileobject:
        df_species = pickle.load(fileobject)
    for index, row in df_species.iterrows():
        species_service.add_species(row["latin_name"])

    with open(
        os.path.join(os.getcwd(), "data_wrangling", "df_time.pkl"), "rb"
    ) as fileobject:
        df_time = pickle.load(fileobject)
    for index, row in df_time.iterrows():
        timestamp_service.add_timestamp(row["timestamp"])

    all_languages = language_dao.get_all()
    language_lookup = {lang.name: lang.ID for lang in all_languages}

    all_species = species_dao.get_all()
    species_lookup = {s.latin_name: s.ID for s in all_species}

    all_timestamps = timestamp_dao.get_all()
    timestamp_lookup = {t.time: t.ID for t in all_timestamps}

    with open(
        os.path.join(os.getcwd(), "data_wrangling", "df_pageviews.pkl"), "rb"
    ) as fileobject:
        df_pageviews = pickle.load(fileobject)

    for index, row in df_pageviews.iterrows():
        language_ID = language_lookup.get(row["language"])  # Use lookup
        species_ID = species_lookup.get(row["species"])  # Use lookup
        timestamp_ID = timestamp_lookup.get(row["timestamp"])  # Use lookup

        pageview_service.add_pageview(
            timestamp_ID=timestamp_ID,
            language_ID=language_ID,
            species_ID=species_ID,
            number_of_pageviews=row["number_of_pageviews"],
        )

        if index == 20_000:  # Limit to first 20000 rows for testing
            break
