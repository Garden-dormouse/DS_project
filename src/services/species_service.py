from db_module.dao.abstract import SpeciesDAO


class SpeciesService:
    def __init__(self, species_dao: SpeciesDAO):
        self.species_dao = species_dao

    def add_species(self, latin_name: str, species_type: str):
        return self.species_dao.create_single(latin_name, species_type)

    def add_many_species(self, species_list: list[tuple[str, str]]):
        return self.species_dao.create_many(species_list)

    def search_species(
        self,
        query: str | None = None,
        species_type: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        items, has_more = self.species_dao.search(
            query=query,
            species_type=species_type,
            limit=limit,
            offset=offset,
        )

        return {
            "items": [
                {"id": species.id, "latin_name": species.latin_name, "type": species.type}
                for species in items
            ],
            "limit": limit,
            "offset": offset,
            "has_more": has_more,
            "next_offset": offset + len(items) if has_more else None,
        }
