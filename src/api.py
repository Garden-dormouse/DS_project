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
from services.language_service import LanguageService

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_URL = os.getenv("DB_URL")
engine = get_engine(DB_URL)
SessionFactory = get_session_factory(engine)


@app.route("/api/species", methods=["GET"])
def get_species():
    """Get all species."""
    with SessionFactory() as session:
        species_dao = SQLAlchemySpeciesDAO(session)
        species = species_dao.get_all()
        return jsonify([{"id": s.ID, "latin_name": s.latin_name} for s in species])


@app.route("/api/species/types", methods=["GET"])
def get_species_types():
    """Get available species types."""
    return jsonify(["mammal", "bird", "reptile"])


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
                    "code": lang.iso_639_3,
                    "name": lang.name,
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
    - species_type: mammal | bird | reptile
    """
    language_code = request.args.get("language_code")
    limit = request.args.get("limit", default=20, type=int)
    start_month = request.args.get("start_month")
    end_month = request.args.get("end_month")
    species_type = request.args.get("species_type")

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
            species_type=species_type,
        )

    return jsonify(result)


@app.route("/api/pageviews/timeseries", methods=["GET"])
def get_timeseries():
    """
    Get monthly pageviews timeseries for a specific language and optional species.

    Query params:
    - language_code: ISO 639-3
    - species_id: optional species ID
    - start_month: YYYY-MM
    - end_month: YYYY-MM
    - species_type: mammal | bird | reptile
    """
    language_code = request.args.get("language_code")
    species_id = request.args.get("species_id", type=int)
    start_month = request.args.get("start_month")
    end_month = request.args.get("end_month")
    species_type = request.args.get("species_type")

    if not language_code:
        return jsonify([])

    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_timeseries(
            language_code=language_code,
            species_id=species_id,
            start_month=start_month,
            end_month=end_month,
            species_type=species_type,
        )

    return jsonify(result)


@app.route("/api/languages/map-data", methods=["GET"])
def get_languages_map_data():
    """
    Get all languages with their total pageviews for map visualization.

    Query params:
    - month: Specific month in YYYY-MM format
    - species_type: mammal | bird | reptile
    """
    month = request.args.get("month")
    species_type = request.args.get("species_type")

    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_languages_map_data(month, species_type)

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


@app.route("/api/languages/<iso_code>/range", methods=["GET"])
def get_language_range(iso_code):
    """
    Get the geographic range of a language in GeoJSON format.
    Input:
      iso_code = ISO 639-3 code
    Output:
      GeoJSON FeatureCollection with polygon data, or empty FeatureCollection if not found
    """
    with SessionFactory() as session:
        language_dao = SQLAlchemyLanguageDAO(session)
        service = LanguageService(language_dao)
        result = service.get_range_by_iso(iso_code)

    return jsonify(result or {"type": "FeatureCollection", "features": []})


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")