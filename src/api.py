"""
Flask API for serving pageview data from the database.
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text

from db_module.engine import get_engine, get_session_factory
from db_module.dao.species_dao import SQLAlchemySpeciesDAO
from db_module.dao.language_dao import SQLAlchemyLanguageDAO
from db_module.dao.pageview_dao import SQLAlchemyPageviewDAO
from db_module.dao.timestamp_dao import SQLAlchemyTimestampDAO
from services.pageview_service import PageviewService
from services.species_service import SpeciesService
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
    """Get paginated species results for search and selection."""
    query = request.args.get("q")
    species_type = request.args.get("species_type")
    requested_limit = request.args.get("limit", default=50, type=int)
    requested_offset = request.args.get("offset", default=0, type=int)
    limit = max(1, min(requested_limit or 50, 100))
    offset = max(requested_offset or 0, 0)

    with SessionFactory() as session:
        species_dao = SQLAlchemySpeciesDAO(session)
        service = SpeciesService(species_dao)
        return jsonify(
            service.search_species(
                query=query,
                species_type=species_type,
                limit=limit,
                offset=offset,
            )
        )


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
    Get top species by pageviews for one or more languages and optional month range.

    Query params:
    - language_codes: comma-separated ISO 639-3 codes, e.g. eng,fra,deu
    - language_code: single ISO 639-3 code (backward compatible)
    - limit: Number of results (default 20)
    - start_month: YYYY-MM
    - end_month: YYYY-MM
    - species_type: mammal | bird | reptile
    """
    language_codes_raw = request.args.get("language_codes", "").strip()
    single_language_code = request.args.get("language_code", "").strip()
    limit = request.args.get("limit", default=20, type=int)
    start_month = request.args.get("start_month")
    end_month = request.args.get("end_month")
    species_type = request.args.get("species_type")

    language_codes = []
    if language_codes_raw:
        language_codes = [c.strip() for c in language_codes_raw.split(",") if c.strip()]
    elif single_language_code:
        language_codes = [single_language_code]

    if not language_codes:
        return jsonify([])

    with SessionFactory() as session:
        placeholders = []
        params = {"limit": limit}

        for i, code in enumerate(language_codes):
            key = f"lang_{i}"
            placeholders.append(f":{key}")
            params[key] = code

        where_clauses = [f"l.ISO_639_3 IN ({', '.join(placeholders)})"]

        if start_month:
            where_clauses.append("to_char(t.Time, 'YYYY-MM') >= :start_month")
            params["start_month"] = start_month

        if end_month:
            where_clauses.append("to_char(t.Time, 'YYYY-MM') <= :end_month")
            params["end_month"] = end_month

        if species_type:
            where_clauses.append("s.Type = :species_type")
            params["species_type"] = species_type

        sql = text(
            f"""
            SELECT
                s.ID AS id,
                s.Latin_name AS latin_name,
                s.Type AS type,
                SUM(p.Number_of_Pageviews) AS pageviews
            FROM Pageviews p
            JOIN Species s
                ON s.ID = p.Species_ID
            JOIN Languages l
                ON l.ID = p.Language_ID
            JOIN Timestamps t
                ON t.ID = p.Timestamp_ID
            WHERE {" AND ".join(where_clauses)}
            GROUP BY s.ID, s.Latin_name, s.Type
            ORDER BY pageviews DESC
            LIMIT :limit
            """
        )

        rows = session.execute(sql, params).mappings().all()

        result = [
            {
                "id": int(row["id"]),
                "latin_name": row["latin_name"],
                "type": row["type"],
                "pageviews": int(row["pageviews"] or 0),
            }
            for row in rows
        ]

    return jsonify(result)


@app.route("/api/pageviews/top-languages", methods=["GET"])
def get_top_languages():
    """
    Get top languages by pageviews for a specific species and optional month range.

    Query params:
    - species_id: integer
    - limit: Number of results (default 20)
    - start_month: YYYY-MM
    - end_month: YYYY-MM
    - species_type: mammal | bird | reptile
    """
    species_id = request.args.get("species_id", type=int)
    limit = request.args.get("limit", default=20, type=int)
    start_month = request.args.get("start_month")
    end_month = request.args.get("end_month")
    species_type = request.args.get("species_type")

    if species_id is None:
        return jsonify([])

    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_top_languages_for_species(
            species_id=species_id,
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
    - start_month: Start month in YYYY-MM format (inclusive)
    - end_month: End month in YYYY-MM format (inclusive)
    - species_type: mammal | bird | reptile
    - species_id: optional integer
    """
    start_month = request.args.get("start_month")
    end_month = request.args.get("end_month")
    species_type = request.args.get("species_type")
    species_id = request.args.get("species_id", type=int)

    with SessionFactory() as session:
        pageview_dao = SQLAlchemyPageviewDAO(session)
        service = PageviewService(pageview_dao)
        result = service.get_languages_map_data(start_month, end_month, species_type, species_id)

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