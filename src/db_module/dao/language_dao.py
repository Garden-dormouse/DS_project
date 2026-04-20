from sqlalchemy import or_
from sqlalchemy.orm import Session
from db_module.models import Language
from db_module.dao.abstract import LanguageDAO


class SQLAlchemyLanguageDAO(LanguageDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, language_id: int) -> Language | None:
        return self.session.get(Language, language_id)

    def get_all(self):
        return self.session.query(Language).all()

    def get_by_name(self, name: str) -> Language | None:
        query = self.session.query(Language).filter(Language.name == name)
        return query.first()

    def get_by_iso(self, iso_639_3: str) -> Language | None:
        query = self.session.query(Language).filter(Language.iso_639_3 == iso_639_3)
        return query.first()

    def create(self, name: str, iso_639_3: str, language_range: str) -> Language:
        language = Language(
            name=name, iso_639_3=iso_639_3, language_range=language_range
        )
        self.session.add(language)
        self.session.commit()
        return language

    def create_many(self, languages_list: list[tuple[str, str, str]]) -> list[Language]:
        if not languages_list:
            return []

        names = {name for name, _, _ in languages_list if name}
        isos = {iso for _, iso, _ in languages_list if iso}

        existing_names: set[str] = set()
        existing_isos: set[str] = set()

        if names or isos:
            filters = []
            if names:
                filters.append(Language.name.in_(names))
            if isos:
                filters.append(Language.iso_639_3.in_(isos))

            existing_rows = (
                self.session.query(Language.name, Language.iso_639_3)
                .filter(or_(*filters))
                .all()
            )
            existing_names = {name for name, _ in existing_rows if name}
            existing_isos = {iso for _, iso in existing_rows if iso}

        language_objects: list[Language] = []
        seen_names = set(existing_names)
        seen_isos = set(existing_isos)

        for name, iso_639_3, language_range in languages_list:
            if name in seen_names:
                continue
            if iso_639_3 and iso_639_3 in seen_isos:
                continue

            language = Language(
                name=name,
                iso_639_3=iso_639_3,
                language_range=language_range,
            )
            language_objects.append(language)
            seen_names.add(name)
            if iso_639_3:
                seen_isos.add(iso_639_3)

        if language_objects:
            self.session.add_all(language_objects)
            self.session.commit()

        return language_objects
