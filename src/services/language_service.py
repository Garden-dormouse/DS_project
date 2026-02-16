from db.dao.abstract import LanguageDAO

class LanguageService:

    def __init__(self, language_dao: LanguageDAO):
        self.language_dao = language_dao

    def add_language(self, name: str):
        return self.language_dao.create(name)