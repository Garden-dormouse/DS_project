import csv
import pickle
from urllib.request import urlretrieve

import langcodes  # for two-letter ISO 639 language codes
import pandas as pd

print("Downloading language data")
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
macro_to_individual = {}
with open("./iso-639-3-macrolanguages.tab", encoding="utf8") as f:
    next(f)
    for line in f:
        macro, individual, status = line.strip().split("\t")

        # Change this when mapping to all individual languages
        if macro not in macro_to_individual:
            macro_to_individual[macro] = individual


### NEW DATA IN
print("Opening new data")
raw_data = "pageview_reptile_monthly"
typename = raw_data.split("_")[1]  # necessary when other types of animal are added
# frequency = raw_data.split("_")[2]  # might be necessary to specify time granularity later, but only monthly data for now

with open(
    "./" + raw_data + ".pkl",
    "rb",  # path for your data location
) as fileobject:
    dct = pickle.load(fileobject)


### SPECIES
try:
    print("Opening existing table 'species'")
    old_species = pickle.load(open("df_species.pkl", "rb"))
    old_species_set = set(old_species["latin_name"])

    print("Checking new data for new species")
    new_species_set = set(dct.keys()).difference(old_species_set)
    # TODO: what if no new species, does it work?
    new_species = pd.DataFrame(list(dct.keys()))
    new_species.columns = ["latin_name"]
    new_species["type"] = typename

    df_species = pd.concat([old_species, new_species])

except FileNotFoundError:
    print("Old 'species' file not found! Use 'datawrangle.py' instead.")
    quit()


### TIME
# TODO: extract new time range - going through the data is a lot of work, maybe just add timerange to file name?
# Currently no data from new time range anyway
try:
    df_time = pickle.load(open("df_time.pkl", "rb"))
except FileNotFoundError:
    print("Old 'time' file not found! Use 'datawrangle.py' instead.")
    quit()


### LANGUAGE - creating table
try:
    print("Opening existing table 'language'")
    old_languages = pickle.load(open("df_languages.pkl", "rb"))

    print("Checking new data for new languages")
    list_language_codes = list()
    # only adding languages for the species from 'new' data:
    for spec in dct.keys():
        languages = list(dct[spec].keys())
        list_language_codes.extend(languages)

    set_language_codes = set(list_language_codes)
    data_languages = pd.DataFrame(set_language_codes)
    data_languages.columns = ["code"]
    data_languages["language"] = [
        langcodes.Language.make(language=lang).display_name()
        for lang in data_languages["code"]
    ]

    def get_iso3(code):
        try:
            return langcodes.Language.get(code).to_alpha3()
        except Exception:
            return None

    data_languages["iso639_3"] = data_languages["code"].apply(get_iso3)

    def get_glottocode(iso):
        if iso is None:
            return None

        if iso in macro_to_individual:
            return iso_to_glotto.get(macro_to_individual[iso])

        return iso_to_glotto.get(iso)

    data_languages["glottocode"] = data_languages["iso639_3"].apply(get_glottocode)

    print("Comparing sets of old and new languages")
    # What to compare on? Language name, iso639_3, glottocode? Comparing on 'language' for now, as that is what pageviews are tied to in the architecture
    new_language_set = set(data_languages["language"]).difference(
        old_languages["language"]
    )
    # TODO: what if no new languages, does it work?
    new_languages = data_languages[
        data_languages["language"].isin(list(new_language_set))
    ]

    df_languages = pd.concat([old_languages, new_languages])

except FileNotFoundError:
    print("Old 'language' file not found! Use 'datawrangle.py' instead.")


### PAGEVIEWS - creating table
# Due to how data is extracted, there should not be any "new" data on pageviews for old species with old languages for an old time range
# So we do not have to check old pageview data, otherwise this would be too time-consuming to process
# Basically the assumption here is that there is only new pageview data for:
# - new species
# - old species with new languages
# - old species with old languages with new time range
# This assumption does not hold true for any data on old species with old languages that had some time range data missing at time of wrangling
# That pageview data from that missing time range will not be able to be added here
try:
    print("Opening existing table 'pageviews'")
    old_pageviews = pickle.load(open("df_pageviews.pkl", "rb"))

    species = list()
    timestamps = list()
    pageviews = list()
    languages = list()

    # For new species:
    for spec in new_species["latin_name"]:
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

    # For old species, new languages:
    for spec in old_species["latin_name"]:
        # Checking what languages this species has data in, and finding the new languages:
        try:
            languages_spec = list(dct[spec].keys())
            old_languages_spec = old_pageviews[
                old_pageviews["language"].isin(list(new_language_set))
            ]
            new_languages_spec = set(languages_spec).difference(
                old_languages_spec["language"]
            )
        except KeyError:
            break

        for lang in new_languages_spec:
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

    new_pageviews = pd.DataFrame(
        {
            "timestamp": timestamps,
            "language": languages,
            "species": species,
            "number_of_pageviews": pageviews,
        }
    )

except FileNotFoundError:
    print("Old 'pageview' file not found! Use 'datawrangle.py' instead.")


### Saving tables as pickle files
print("Saving tables to pickle files")
print(new_species.dtypes)
new_species.to_pickle("./new_species_" + typename + ".pkl")

print(new_languages.dtypes)
new_languages.to_pickle("./new_languages_" + typename + ".pkl")

# Actually have to add something to add new time range data
# print(new_time.dtypes)
# new_time.to_pickle("./new_time.pkl")

print(new_pageviews.dtypes)
new_pageviews.to_pickle("./new_pageviews_" + typename + ".pkl")
