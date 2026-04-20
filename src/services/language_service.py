from db_module.dao.abstract import LanguageDAO

import json


class LanguageService:
    def __init__(self, language_dao: LanguageDAO):

        self.language_dao = language_dao

    def get_range_by_name(self, name: str) -> dict:
        """
        Get the geographic range of a language by its name

        Args:
            name (str): The name of the language.

        Returns:
            dict: GeoJSON data of the language's range, or empty dict if not found
        """
        language = self.language_dao.get_by_name(name)
        return (
            json.loads(language.language_range)
            if language and language.language_range
            else {}
        )

    def get_range_by_iso(self, iso_639_3: str) -> dict:
        """
        Get the geographic range of a language by its ISO 639-3 code

        Args:
            iso_639_3 (str): The ISO 639-3 code of the language

        Returns:
            dict: GeoJSON data of the language's range, or empty dict if not found
        """
        language = self.language_dao.get_by_iso(iso_639_3)
        return (
            json.loads(language.language_range)
            if language and language.language_range
            else {}
        )

    def add_language(self, name: str, iso_639_3: str, language_range: str):

        return self.language_dao.create(name, iso_639_3, language_range)

    def add_many_languages(
        self, languages_list: list[tuple[str, str, str]]
    ):
        return self.language_dao.create_many(languages_list)
