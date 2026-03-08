"""
Flask API for serving pageview data from the database.
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import func
from datetime import datetime

from db_module.engine import get_engine, get_session_factory
from db_module.models import Species, Language, Timestamp, Pageview
from db_module.dao.species_dao import SQLAlchemySpeciesDAO
from db_module.dao.language_dao import SQLAlchemyLanguageDAO
from db_module.dao.pageview_dao import SQLAlchemyPageviewDAO
from db_module.dao.timestamp_dao import SQLAlchemyTimestampDAO
from services.pageview_service import PageviewService
from services.timestamp_service import TimestampService

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_PATH = os.getenv("DB_PATH")
DB_URL = f"sqlite:///{DB_PATH}"
engine = get_engine(DB_URL)
SessionFactory = get_session_factory(engine)


@app.route("/api/species", methods=["GET"])
def get_species():
    """Get all species."""
    with SessionFactory() as session:
        species_dao = SQLAlchemySpeciesDAO(session)
        species = species_dao.get_all()
        return jsonify([{"id": s.ID, "latin_name": s.latin_name} for s in species])


@app.route("/api/languages", methods=["GET"])
def get_languages():
    """Get all languages."""
    with SessionFactory() as session:
        language_dao = SQLAlchemyLanguageDAO(session)
        languages = language_dao.get_all()

        # Simple deduplication by name
        seen = {}
        for lang in languages:
            if lang.glottocode and lang.glottocode not in seen:
                seen[lang.glottocode] = {
                    "code": lang.glottocode,  # Return glottocode for API calls
                    "name": lang.name,  # Display name in UI
                }

        return jsonify(list(seen.values()))


# @app.route("/api/pageviews/timeseries", methods=["GET"])
# def get_timeseries():
#     """
#     Get time series data for visualization.
#     Query params:
#     - species_id: Filter by species ID
#     - language_codes: Comma-separated language codes
#     - start_date: Start date (YYYY-MM-DD)
#     - end_date: End date (YYYY-MM-DD)
#     """
#     with SessionFactory() as session:
#         species_id = request.args.get("species_id", type=int)
#         language_codes = request.args.get("language_codes", "").split(",")
#         start_date = request.args.get("start_date")
#         end_date = request.args.get("end_date")

#         query = (
#             session.query(
#                 Timestamp.time,
#                 func.sum(Pageview.number_of_pageviews).label("pageviews"),
#             )
#             .join(Pageview, Timestamp.ID == Pageview.timestamp_ID)
#             .join(Species, Pageview.species_ID == Species.ID)
#             .join(Language, Pageview.language_ID == Language.ID)
#         )

#         if species_id:
#             query = query.filter(Pageview.species_ID == species_id)

#         if language_codes and language_codes[0]:
#             query = query.filter(Language.name.in_(language_codes))

#         if start_date:
#             query = query.filter(Timestamp.time >= start_date)

#         if end_date:
#             query = query.filter(Timestamp.time <= end_date)

#         query = query.group_by(Timestamp.time).order_by(Timestamp.time)

#         results = query.all()

#         return jsonify(
#             [
#                 {
#                     "date": (
#                         timestamp.isoformat()
#                         if isinstance(timestamp, datetime)
#                         else timestamp
#                     ),
#                     "value": int(pageviews or 0),
#                 }
#                 for timestamp, pageviews in results
#             ]
#         )


@app.route("/api/pageviews/top-species", methods=["GET"])
def get_top_species():
    """
    Get top species by pageviews for a specific language.
    Query params:
    - language_code: Single language code
    - limit: Number of results (default 20)
    """
    language_code = request.args.get("language_code")
    limit = request.args.get("limit", default=20, type=int)

    if not language_code:
        return jsonify([])
    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_top_species_for_language(language_code, limit)

    return jsonify(result)


@app.route("/api/languages/map-data", methods=["GET"])
def get_languages_map_data():
    """
    Get all languages with their total pageviews for map visualization.
    Query params:
    - month: Specific month in YYYY-MM format (optional, if not specified shows all data)
    """
    month = request.args.get("month")  # e.g., "2024-01"
    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_languages_map_data(month)

    return jsonify(result)


@app.route("/api/timestamps/months", methods=["GET"])
def get_available_months():
    """
    Get list of available months in the database for time selection.
    Returns: List of month strings in YYYY-MM format.
    """
    with SessionFactory() as session:
        timestamp_dao = SQLAlchemyTimestampDAO(session)
        service = TimestampService(timestamp_dao)
        months = service.get_available_months()

        return jsonify(months)


# @app.route("/api/languages/<language_code>/countries", methods=["GET"])
# def get_language_countries(language_code):
#     """
#     Get all countries where a specific language is spoken.
#     Returns: List of ISO3 country codes.

#     If Language_Regions table exists, queries it.
#     Otherwise, falls back to hardcoded mapping.
#     """
#     with SessionFactory() as session:
#         # Try to query Language_Regions table
#         try:
#             results = session.execute(
#                 """
#                 SELECT DISTINCT lr.ISO3_Country_Code
#                 FROM Language_Regions lr
#                 JOIN Languages l ON lr.Language_ID = l.ID
#                 WHERE l.Name = ?
#                 """,
#                 (language_code,),
#             ).fetchall()

#             if results:
#                 countries = [row[0] for row in results]
#                 return jsonify(countries)
#         except Exception as e:
#             print(f"Language_Regions table not available: {e}")

#         # Fallback: hardcoded language-to-country mapping
#         lang_to_countries = {
#             "en": ["USA", "GBR", "CAN", "AUS", "NZL", "IRL"],
#             "fi": ["FIN", "SWE"],
#             "sv": ["SWE", "FIN", "NOR"],
#             "fr": ["FRA", "BEL", "CHE", "CAN", "LUX"],
#             "de": ["DEU", "AUT", "CHE", "LIE"],
#             "es": ["ESP", "MEX", "ARG", "COL", "PER", "VEN", "CHL"],
#             "zh": ["CHN", "TWN", "SGP"],
#             "ja": ["JPN"],
#             "pt": ["PRT", "BRA"],
#             "it": ["ITA", "CHE"],
#             "ru": ["RUS", "BLR", "KAZ"],
#             "ar": ["SAU", "EGY", "ARE", "JOR", "LBN"],
#             "nl": ["NLD", "BEL"],
#             "pl": ["POL"],
#             "tr": ["TUR"],
#             "ko": ["KOR"],
#             "vi": ["VNM"],
#             "hi": ["IND"],
#             "no": ["NOR"],
#             "da": ["DNK"],
#             "cs": ["CZE"],
#             "el": ["GRC"],
#             "th": ["THA"],
#             "id": ["IDN"],
#             "uk": ["UKR"],
#             "ro": ["ROU"],
#             "hu": ["HUN"],
#             "he": ["ISR"],
#             "fa": ["IRN"],
#         }

#         countries = lang_to_countries.get(language_code, [])
#         return jsonify(countries)


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
