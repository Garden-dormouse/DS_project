from db_module.dao.abstract import LanguageDAO


class LanguageService:
    def __init__(self, language_dao: LanguageDAO):


        self.language_dao = language_dao

    def add_language(self, name: str, iso_639_3: str, glottocode: str):


        return self.language_dao.create(name, iso_639_3, glottocode)
