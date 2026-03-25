import csv
import os
import pickle
from collections import defaultdict
from urllib.request import urlretrieve

import langcodes  # for two-letter ISO 639 language codes
import pandas as pd

print("Downloading raw data")
downloads = [
    {
        "url": "https://raw.githubusercontent.com/glottolog/glottolog-cldf/refs/heads/master/cldf/languages.csv",
        "filename": "languages.csv",
    }
]

for download in downloads:
    urlretrieve(download["url"], download["filename"])


# Initialize ISO639P3 to Glottocode dict
print("Mapping ISO 639-3 to Glottocode")
iso_to_glotto = {}

with open("./languages.csv", encoding="utf8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        iso = row["ISO639P3code"]
        glotto = row["ID"]

        if iso:
            iso_to_glotto[iso] = glotto

print("Mapping macrolanguages to individual languages")
macro_to_individuals = defaultdict(set)
with open("./iso-639-3-macrolanguages.tab", encoding="utf8") as f:
    next(f)
    for line in f:
        macro, individual, status = line.strip().split("\t")
        macro_to_individuals[macro].add(individual)


### ANIMAL TYPES TO PROCESS
animal_types = ["reptile", "bird", "mammal"]

# Create time table once (same for all animal types)
print("Creating table 'time'")
list_time = list()

for year_id in range(0, 12):  # hardcoded to be 2015-2026 right now, can be altered
    year = str(2015 + year_id)
    for month_id in range(1, 13):
        month = f"{month_id:02}"
        day = "01"  # data could be granular to the day, in this case adjust here
        hour = "00"  # always 00, midnight
        time_str = year + month + day + hour
        datetime = pd.to_datetime(
            time_str, format="%Y%m%d%H"
        )  # input example: 2015070100
        list_time.append(datetime)
        if year == "2026" and month == "01":
            break

df_time = pd.DataFrame(list_time)
df_time.columns = ["timestamp"]

print("Saving time table to pickle file")
df_time.to_pickle("./df_time.pkl")

# Process each animal type
for animal_type in animal_types:
    print(f"\n{'='*50}")
    print(f"Processing {animal_type}")
    print(f"{'='*50}")

    raw_data = f"pageview_{animal_type}_monthly"

    try:
        with open(f"./{raw_data}.pkl", "rb") as fileobject:
            dct = pickle.load(fileobject)
    except FileNotFoundError:
        print(f"WARNING: {raw_data}.pkl not found. Skipping {animal_type}.")
        continue

    # Check if all output files already exist
    output_files = [
        f"./df_species_{animal_type}.pkl",
        f"./df_languages_{animal_type}.pkl",
        f"./df_pageviews_{animal_type}.pkl",
    ]

    if all(os.path.exists(f) for f in output_files):
        print(f"Output files for {animal_type} already exist. Skipping...")
        continue

    ### SPECIES - creating table
    print(f"Creating table 'species' for {animal_type}")
    df_species = pd.DataFrame(list(dct.keys()))
    df_species.columns = ["latin_name"]
    df_species["type"] = animal_type

    ### LANGUAGE - creating table
    print(f"Creating table 'language' for {animal_type}")
    list_language_codes = list()
    # finding all the languages from the pageview data:
    for spec in df_species["latin_name"]:
        languages = list(dct[spec].keys())
        list_language_codes.extend(languages)

    set_language_codes = set(list_language_codes)
    df_languages = pd.DataFrame(set_language_codes)
    df_languages.columns = ["code"]
    df_languages["language"] = [
        langcodes.Language.make(language=lang).display_name()
        for lang in df_languages["code"]
    ]

    def get_iso3(code):
        try:
            return langcodes.Language.get(code).to_alpha3()
        except Exception:
            return None

    df_languages["iso639_3"] = df_languages["code"].apply(get_iso3)

    def get_glottocodes(iso):
        if iso is None:
            return set()

        # Collect all individual languages linked to a macrolanguage
        if iso in macro_to_individuals:
            return {
                iso_to_glotto[ind]
                for ind in macro_to_individuals[iso]
                if ind in iso_to_glotto
            }

        # Direct match
        if iso in iso_to_glotto:
            return {iso_to_glotto[iso]}

        return set()

    # Glottocodes as a semicolon-separated list
    df_languages["glottocode"] = df_languages["iso639_3"].apply(
        lambda iso: ";".join(sorted(get_glottocodes(iso))) or None
    )

    ### PAGEVIEWS - creating table
    print(f"Creating table 'pageviews' for {animal_type}")
    species = list()
    timestamps = list()
    pageviews = list()
    languages = list()

    for spec in df_species["latin_name"]:
        languages_spec = list(dct[spec].keys())

        for lang in languages_spec:
            timestamps_lang = dct[spec][lang]["timestamp"]
            timestamps_lang_datetime = pd.to_datetime(
                timestamps_lang, format="%Y%m%d%H"
            )
            timestamps.extend(timestamps_lang_datetime)

            species.extend([spec] * len(timestamps_lang))

            lang_name = df_languages.loc[df_languages["code"] == lang][
                "language"
            ].item()
            languages.extend([lang_name] * len(timestamps_lang))

            pageviews_lang = dct[spec][lang]["views"]
            pageviews.extend(pageviews_lang)

    df_pageviews = pd.DataFrame(
        {
            "timestamp": timestamps,
            "language": languages,
            "species": species,
            "number_of_pageviews": pageviews,
        }
    )

    ### Saving tables as pickle files
    print(f"Saving {animal_type} tables to pickle files")
    print(df_species.dtypes)
    df_species.to_pickle(f"./df_species_{animal_type}.pkl")

    print(df_languages.dtypes)
    df_languages.to_pickle(f"./df_languages_{animal_type}.pkl")

    print(df_pageviews.dtypes)
    df_pageviews.to_pickle(f"./df_pageviews_{animal_type}.pkl")

print(f"\n{'='*50}")
print("All animal types processed successfully!")
print(f"{'='*50}")
