from sqlalchemy.orm import Session
from db.models import Species
from db.dao.abstract import SpeciesDAO

class SQLAlchemySpeciesDAO(SpeciesDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, species_ID: int) -> Species | None:
        return self.session.get(Species, species_ID)

    def get_all(self):
        return self.session.query(Species).all()

    def create(self, latin_name: str) -> Species:
        species = Species(latin_name=latin_name)
        self.session.add(species)
        self.session.commit()
        return species
