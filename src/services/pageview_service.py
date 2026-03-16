from db_module.dao.abstract import PageviewDAO


class PageviewService:

    def __init__(self, pageview_dao: PageviewDAO):
        self.pageview_dao = pageview_dao

    def get_top_species_for_language(self, language_code: str, limit: int = 20):
        """
        Return top species by pageviews for a language.

        Args:
            language_code (str): The ISO 639 code of the language to filter pageviews by.
            limit (int): Maximum number of species to return.

        Returns:
            list[dict]: List of dicts with 'id', 'latin_name', 'pageviews'.
        """
        top_species = self.pageview_dao.get_top_species_by_language(
            language_code, limit
        )
        return [
            {"id": species_id, "latin_name": latin_name, "pageviews": int(total)}
            for species_id, latin_name, total in top_species
        ]

    def get_languages_map_data(self, month: str | None = None) -> dict[str, int]:
        """
        Return total pageviews per language, mapped to ISO3 country codes.

        Args:
            month (str | None): Optional month filter in 'YYYY-MM' format.

        Returns:
            dict[str, int]: Mapping from ISO3 country code (or language code) to total pageviews.
        """
        # Map language codes to ISO3 country codes
        lang_to_country = {
            "en": "USA",
            "fi": "FIN",
            "sv": "SWE",
            "fr": "FRA",
            "de": "DEU",
            "es": "ESP",
            "zh": "CHN",
            "ja": "JPN",
            "pt": "PRT",
            "it": "ITA",
            "ru": "RUS",
            "ar": "SAU",
            "nl": "NLD",
            "pl": "POL",
            "tr": "TUR",
            "ko": "KOR",
        }

        raw_results = self.pageview_dao.get_total_pageviews_by_language(month)

        return {
            lang_to_country.get(lang, lang.upper()): int(total)
            for lang, total in raw_results
        }

    def add_pageview(
        self,
        timestamp_ID: int,
        language_ID: int,
        species_ID: int,
        number_of_pageviews: int,
    ):
        return self.pageview_dao.create(
            timestamp_ID=timestamp_ID,
            language_ID=language_ID,
            species_ID=species_ID,
            number_of_pageviews=number_of_pageviews,
        )
