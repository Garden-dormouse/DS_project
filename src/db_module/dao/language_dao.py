from sqlalchemy.orm import Session
from db_module.models import Language
from db_module.dao.abstract import LanguageDAO


class SQLAlchemyLanguageDAO(LanguageDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, language_ID: int) -> Language | None:
        return self.session.get(Language, language_ID)

    def get_all(self):
        return self.session.query(Language).all()
    
    def get_by_name(self, name: str) -> Language | None:
        query = (self.session.query(Language)
        .filter(Language.name == name)
        )
        return query.first()

    def get_by_iso(self, iso_639_3: str) -> Language | None:
        query = (self.session.query(Language)
        .filter(Language.iso_639_3 == iso_639_3)         
        )
        return query.first()

    def create(self, name: str, iso_639_3: str, language_range: str) -> Language:
        language = Language(name=name, iso_639_3=iso_639_3, language_range=language_range)
        self.session.add(language)
        self.session.commit()
        return language
