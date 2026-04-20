from sqlalchemy.orm import Session

from db_module.dao.abstract import SpeciesDAO
from db_module.models import Species


class SQLAlchemySpeciesDAO(SpeciesDAO):
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, species_id: int) -> Species | None:
        return self.session.get(Species, species_id)

    def get_all(self):
        return self.session.query(Species).all()

    def search(
        self,
        query: str | None = None,
        species_type: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Species], bool]:
        safe_limit = max(1, min(limit, 100))
        safe_offset = max(0, offset)

        search_query = self.session.query(Species)

        if species_type:
            search_query = search_query.filter(Species.type == species_type)

        normalized_query = (query or "").strip()
        if normalized_query:
            search_query = search_query.filter(
                Species.latin_name.ilike(f"%{normalized_query}%")
            )

        results = (
            search_query.order_by(Species.latin_name.asc(), Species.id.asc())
            .offset(safe_offset)
            .limit(safe_limit + 1)
            .all()
        )

        has_more = len(results) > safe_limit
        return results[:safe_limit], has_more

    def create_single(self, latin_name: str, species_type: str) -> Species:
        species = Species(latin_name=latin_name, type=species_type)
        self.session.add(species)
        self.session.commit()
        return species

    def create_many(self, species_list: list[tuple[str, str]]) -> list[Species]:
        species_objects = [
            Species(latin_name=latin_name, type=species_type)
            for latin_name, species_type in species_list
        ]
        self.session.add_all(species_objects)
        self.session.commit()
        return species_objects
