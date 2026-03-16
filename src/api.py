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
        "code": "<glottocode>",
        "name": "<display language name>"
      }
    ]
    """
    with SessionFactory() as session:
        language_dao = SQLAlchemyLanguageDAO(session)
        languages = language_dao.get_all()

        seen = {}
        for lang in languages:
            if lang.glottocode and lang.glottocode not in seen:
                seen[lang.glottocode] = {
                    "code": lang.glottocode,  # used by frontend for API calls
                    "name": lang.name,        # shown in dropdown/UI
                }

        return jsonify(list(seen.values()))


@app.route("/api/pageviews/top-species", methods=["GET"])
def get_top_species():
    """
    Get top species by pageviews for a specific language.

    Query params:
    - language_code: glottocode
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
      language_code = glottocode
    Output:
      List of ISO3 country codes
    """

    # glottocode -> ISO3 country list
    # Adjust/add entries based on the languages you want to support in the UI.
    glottocode_to_countries = {
        # English
        "stan1293": ["USA", "GBR", "CAN", "AUS", "NZL", "IRL"],

        # Finnish
        "finn1318": ["FIN"],

        # Swedish
        "swed1254": ["SWE", "FIN"],

        # French
        "stan1290": ["FRA", "BEL", "CHE", "CAN", "LUX"],

        # German
        "stan1295": ["DEU", "AUT", "CHE", "LIE"],

        # Spanish
        "stan1288": ["ESP", "MEX", "ARG", "COL", "PER", "VEN", "CHL"],

        # Mandarin / Chinese
        "mand1415": ["CHN", "TWN", "SGP"],

        # Japanese
        "nucl1643": ["JPN"],

        # Portuguese
        "port1283": ["PRT", "BRA"],

        # Italian
        "ital1282": ["ITA", "CHE"],

        # Russian
        "russ1263": ["RUS", "BLR", "KAZ"],

        # Arabic
        "arab1395": ["SAU", "EGY", "ARE", "JOR", "LBN"],

        # Dutch
        "dutc1256": ["NLD", "BEL"],

        # Polish
        "poli1260": ["POL"],

        # Turkish
        "nucl1301": ["TUR"],

        # Korean
        "kore1280": ["KOR"],

        # Vietnamese
        "viet1252": ["VNM"],

        # Hindi
        "hind1269": ["IND"],

        # Norwegian
        "norw1258": ["NOR"],

        # Danish
        "dani1284": ["DNK"],

        # Czech
        "czec1258": ["CZE"],

        # Greek
        "mode1248": ["GRC"],

        # Thai
        "thai1261": ["THA"],

        # Indonesian
        "indo1316": ["IDN"],

        # Ukrainian
        "ukra1253": ["UKR"],

        # Romanian
        "roma1327": ["ROU"],

        # Hungarian
        "hung1274": ["HUN"],

        # Hebrew
        "hebr1246": ["ISR"],

        # Persian
        "west2369": ["IRN"],
    }

    return jsonify(glottocode_to_countries.get(language_code, []))


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")