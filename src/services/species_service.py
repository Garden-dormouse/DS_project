from db.dao.abstract import SpeciesDAO

class SpeciesService:

    def __init__(self, species_dao: SpeciesDAO):
        self.species_dao = species_dao

    def add_species(self, latin_name: str):
        return self.species_dao.create(latin_name)