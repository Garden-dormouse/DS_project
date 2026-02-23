import pickle

import langcodes  # for two-letter ISO 639 language codes
import pandas as pd

with open(
    "./pageview_mammal_monthly.pkl", "rb"
) as fileobject:  # path for your data location
    dct = pickle.load(fileobject)


### SPECIES - creating table
df_species = pd.DataFrame(list(dct.keys()))
df_species.columns = ["latin_name"]

### TIME - creating table
list_time = list()

for year_id in range(0, 11):  # hardcoded to be 2015-2025 right now, can be altered
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

df_time = pd.DataFrame(list_time)
df_time.columns = ["timestamp"]


### LANGUAGE - creating table
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


### PAGEVIEWS - creating table
species = list()
timestamps = list()
pageviews = list()
languages = list()

for spec in df_species["latin_name"]:
    languages_spec = list(dct[spec].keys())

    for lang in languages_spec:
        timestamps_lang = dct[spec][lang]["timestamp"]
        timestamps_lang_datetime = pd.to_datetime(timestamps_lang, format="%Y%m%d%H")
        timestamps.extend(timestamps_lang_datetime)

        species.extend([spec] * len(timestamps_lang))

        lang_name = df_languages.loc[df_languages["code"] == lang]["language"].item()
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
print(df_species.dtypes)
df_species.to_pickle("./df_species.pkl")

df_languages = df_languages.drop("code", axis=1)  # 'Code' not in the database setup
print(df_languages.dtypes)
df_languages.to_pickle("./df_languages.pkl")

print(df_time.dtypes)
df_time.to_pickle("./df_time.pkl")

print(df_pageviews.dtypes)
df_pageviews.to_pickle("./df_pageviews.pkl")
