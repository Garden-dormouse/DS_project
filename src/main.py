import os
import datetime

from db.engine import get_engine, get_session_factory
from db.dao.species_dao import SQLAlchemySpeciesDAO
from db.dao.language_dao import SQLAlchemyLanguageDAO
from db.dao.timestamp_dao import SQLAlchemyTimestampDAO
from db.dao.pageview_dao import SQLAlchemyPageviewDAO
from services.species_service import SpeciesService
from services.language_service import LanguageService
from services.timestamp_service import TimestampService
from services.pageview_service import PageviewService
from dotenv import load_dotenv

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
    species = species_service.add_species("Eliomys quercinus")
    language = language_service.add_language("es")
    timestamp = timestamp_service.add_timestamp(datetime.datetime.now())
    pageview_service.add_pageview(
        timestamp_ID=timestamp.ID,
        language_ID=language.ID,
        species_ID=species.ID,
        number_of_pageviews=42
    )
