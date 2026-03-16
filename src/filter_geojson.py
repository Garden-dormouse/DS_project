from urllib.request import urlretrieve
from db_module.dao.language_dao import SQLAlchemyLanguageDAO
from db_module.engine import get_engine, get_session_factory
from dotenv import load_dotenv

import os
import json

load_dotenv()

DB_PATH = os.getenv("DB_PATH")

DB_URL = f"sqlite:///{DB_PATH}"
engine = get_engine(DB_URL)
SessionFactory = get_session_factory(engine)

url = "https://raw.githubusercontent.com/Glottography/asher2007world/refs/heads/main/cldf/contemporary/languages.geojson"
filename = "./data_wrangling/languages.geojson"

urlretrieve(url, filename)

with open(filename, encoding="utf8") as f:
    geo = json.load(f)

with SessionFactory() as session:
    language_dao = SQLAlchemyLanguageDAO(session)
    rows = language_dao.get_all()
    needed_glottocodes = {r.glottocode for r in rows}

    filtered = []
    for feature in geo["features"]:
        glottocode = feature["properties"].get("cldf:languageReference")

        if glottocode in needed_glottocodes:
            filtered.append(feature)

    geo["features"] = filtered

    with open("./data_wrangling/languages_filtered.geojson", "w", encoding="utf8") as f:
        json.dump(geo, f)
