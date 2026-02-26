from sqlalchemy.orm import Session
from db.models import Language
from db.dao.abstract import LanguageDAO

class SQLAlchemyLanguageDAO(LanguageDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, language_ID: int) -> Language | None:
        return self.session.get(Language, language_ID)

    def get_all(self):
        return self.session.query(Language).all()

    def create(self, name: str) -> Language:
        language = Language(name=name)
        self.session.add(language)
        self.session.commit()
        return language
