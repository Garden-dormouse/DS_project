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
