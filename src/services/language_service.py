"""
Service layer for Language operations.

This module contains business logic related to Language objects. Services coordinate one or more
DAOs and enforce application-level rules, validations, and workflows.
"""

from db.dao.abstract import LanguageDAO

class LanguageService:
    """
    Service providing business logic for Language entities.

    This class acts as an intermediary between the application layer and the data access layer.
    """

    def __init__(self, language_dao: LanguageDAO):
        """
        Initialize the service with a DAO dependency.

        Args:
            language_dao (LanguageDAO): Data access object for Language.
        """
        self.language_dao = language_dao

    def add_language(self, name: str):
        """
        Create and persist a new Language.

        Args:
            name: The ISO 639 code of the language.

        Returns:
            Language: The newly created Language.
        """
        return self.language_dao.create(name)
