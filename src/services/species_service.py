from db_module.dao.abstract import SpeciesDAO


class SpeciesService:
    def __init__(self, species_dao: SpeciesDAO):
        self.species_dao = species_dao

    def add_species(self, latin_name: str, species_type: str):
        return self.species_dao.create_single(latin_name, species_type)

    def add_many_species(self, species_list: list[tuple[str, str]]):
        return self.species_dao.create_many(species_list)
