"""
Flask API for serving pageview data from the database.
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from db_module.engine import get_engine, get_session_factory
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
    """
    Get all languages.

    Returns:
    [
      {
        "code": "<ISO 639-3>",
        "name": "<display language name>"
      }
    ]
    """
    with SessionFactory() as session:
        language_dao = SQLAlchemyLanguageDAO(session)
        languages = language_dao.get_all()

        seen = {}
        for lang in languages:
            if lang.iso_639_3 and lang.iso_639_3 not in seen:
                seen[lang.iso_639_3] = {
                    "code": lang.iso_639_3,  # used by frontend for API calls
                    "name": lang.name,        # shown in dropdown/UI
                }

        return jsonify(list(seen.values()))


@app.route("/api/pageviews/top-species", methods=["GET"])
def get_top_species():
    """
    Get top species by pageviews for a specific language and optional month range.

    Query params:
    - language_code: ISO 639-3
    - limit: Number of results (default 20)
    - start_month: YYYY-MM
    - end_month: YYYY-MM
    """
    language_code = request.args.get("language_code")
    limit = request.args.get("limit", default=20, type=int)
    start_month = request.args.get("start_month")
    end_month = request.args.get("end_month")

    if not language_code:
        return jsonify([])

    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_top_species_for_language(
            language_code=language_code,
            limit=limit,
            start_month=start_month,
            end_month=end_month,
        )

    return jsonify(result)


@app.route("/api/languages/map-data", methods=["GET"])
def get_languages_map_data():
    """
    Get all languages with their total pageviews for map visualization.

    Query params:
    - month: Specific month in YYYY-MM format (optional, if not specified shows all data)
    """
    month = request.args.get("month")

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


@app.route("/api/languages/<language_code>/countries", methods=["GET"])
def get_language_countries(language_code):
    """
    Get all countries where a specific language is spoken.
    Input:
      language_code = ISO 639-3
    Output:
      List of ISO3 country codes
    """

    # ISO 639-3 -> ISO3 country list
    # Adjust/add entries based on the languages you want to support in the UI.
    iso_639_3_to_countries = {
        # English
        "eng": ["USA", "GBR", "CAN", "AUS", "NZL", "IRL"],

        # Finnish
        "fin": ["FIN"],

        # Swedish
        "swe": ["SWE", "FIN"],

        # French
        "fra": ["FRA", "BEL", "CHE", "CAN", "LUX"],

        # German
        "deu": ["DEU", "AUT", "CHE", "LIE"],

        # Spanish
        "spa": ["ESP", "MEX", "ARG", "COL", "PER", "VEN", "CHL"],

        # Mandarin / Chinese
        "zho": ["CHN", "TWN", "SGP"],

        # Japanese
        "jpn": ["JPN"],

        # Portuguese
        "por": ["PRT", "BRA"],

        # Italian
        "ita": ["ITA", "CHE"],

        # Russian
        "rus": ["RUS", "BLR", "KAZ"],

        # Arabic
        "ara": ["SAU", "EGY", "ARE", "JOR", "LBN"],

        # Dutch
        "nld": ["NLD", "BEL"],

        # Polish
        "pol": ["POL"],

        # Turkish
        "tur": ["TUR"],

        # Korean
        "kor": ["KOR"],

        # Vietnamese
        "vie": ["VNM"],

        # Hindi
        "hin": ["IND"],

        # Norwegian
        "nor": ["NOR"],

        # Danish
        "dan": ["DNK"],

        # Czech
        "ces": ["CZE"],

        # Greek
        "ell": ["GRC"],

        # Thai
        "tha": ["THA"],

        # Indonesian
        "ind": ["IDN"],

        # Ukrainian
        "ukr": ["UKR"],

        # Romanian
        "ron": ["ROU"],

        # Hungarian
        "hun": ["HUN"],

        # Hebrew
        "heb": ["ISR"],

        # Persian
        "fas": ["IRN"],
    }

    return jsonify(iso_639_3_to_countries.get(language_code, []))


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")