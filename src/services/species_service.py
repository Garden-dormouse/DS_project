"""
Service layer for Species operations.

This module contains business logic related to Species objects. Services coordinate one or more
DAOs and enforce application-level rules, validations, and workflows.
"""

from db.dao.abstract import SpeciesDAO

class SpeciesService:
    """
    Service providing business logic for Species entities.

    This class acts as an intermediary between the application layer and the data access layer.
    """

    def __init__(self, species_dao: SpeciesDAO):
        """
        Initialize the service with a DAO dependency.

        Args:
            species_dao (SpeciesDAO): Data access object for Species.
        """
        self.species_dao = species_dao

    def add_species(self, latin_name: str):
        """
        Create and persist a new Species.

        Args:
            latin_name (str): The Latin name of the species.

        Returns:
            Species: The newly created Species.
        """
        return self.species_dao.create(latin_name)