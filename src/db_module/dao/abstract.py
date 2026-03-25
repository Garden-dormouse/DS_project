"""
Abstract DAO interfaces for database access.

This module defines abstract base classes (ABCs) that specify the contract for data access objects
(DAOs). Concrete implementations must implement these interfaces.
"""

import datetime

from abc import ABC, abstractmethod
from typing import Iterable
from db_module.models import Species, Language, Timestamp, Pageview


class SpeciesDAO(ABC):
    """
    Abstract data access interface for Species objects.

    Implementations of this interface are responsible for adding and retrieving Species records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, species_ID: int) -> Species | None:
        """
        Retrieve a Species by its primary key.

        Args:
            species_ID (int): Primary key of the Species.

        Returns:
            Species | None: The requested Species if found, otherwise None.
        """
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Species]:
        """
        Retrieve all Species.

        Returns:
            Iterable[Species]: All stored Species.
        """
        pass

    @abstractmethod
    def create(self, latin_name: str) -> Species:
        """
        Create and persist a new Species.

        Args:
            latin_name (str): The Latin name of the species.

        Returns:
            Species: The newly created Species.
        """
        pass


class LanguageDAO(ABC):
    """
    Abstract data access interface for Language objects.

    Implementations of this interface are responsible for adding and retrieving Language records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, language_ID: int) -> Language | None:
        """
        Retrieve a Language by its primary key.

        Args:
            language_ID (int): Primary key of the Language.

        Returns:
            Language | None: The requested Language if found, otherwise None.
        """
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Language]:
        """
        Retrieve all Languages.

        Returns:
            Iterable[Language]: All stored Languages.
        """
        pass

    @abstractmethod
    def get_by_name(self, name: str) -> Language | None:
        """
        Retrieve a language by its name.

        Args:
            name (str): The name of the language.

        Returns:
            language (Language | None): The requested Language if found, otherwise None.
        """
        pass

    @abstractmethod
    def get_by_iso(self, iso_639_3: str) -> Language | None:
        """
        Retrieve a language by its ISO 639-3 code.

        Args:
            iso_639_3 (str): The three-letter ISO 639-3 code of the language.

        Returns:
            language (Language | None): The requested Language if found, otherwise None.
        """
        pass

    @abstractmethod
    def create(self, name: str, iso_639_3: str, language_range: str) -> Language:
        """
        Create and persist a new Language.

        Args:
            name (str): The name of the language.
            iso_639_3 (str): The ISO 639-3 code of the language.
            language_range (str): The GeoJSON dump with language range polygons.

        Returns:
            Language: The newly created Language.
        """
        pass


class TimestampDAO(ABC):
    """
    Abstract data access interface for Timestamp objects.

    Implementations of this interface are responsible for adding and retrieving Timestamp records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, timestamp_ID: int) -> Timestamp | None:
        """
        Retrieve a Timestamp by its primary key.

        Args:
            timestamp_ID (int): Primary key of the Timestamp.

        Returns:
            Timestamp | None: The requested Timestamp if found, otherwise None.
        """
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Timestamp]:
        """
        Retrieve all Timestamps.

        Returns:
            Iterable[Timestamp]: All stored Timestamps.
        """
        pass

    @abstractmethod
    def get_available_months(self) -> list[str]:
        """
        Return a list of distinct months available in the timestamps table.

        Returns:
            list[str]: List of months in 'YYYY-MM' format.
        """
        pass

    @abstractmethod
    def create(self, time: datetime.datetime) -> Timestamp:
        """
        Create and persist a new Timestamp.

        Args:
            time (datetime.datetime): The time of the Timestamp.

        Returns:
            Timestamp: The newly created Timestamp.
        """
        pass


class PageviewDAO(ABC):
    """
    Abstract data access interface for Pageview objects.

    Implementations of this interface are responsible for adding and retrieving Pageview records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, pageview_ID: int) -> Pageview | None:
        """
        Retrieve a Pageview by its primary key.

        Args:
            pageview_ID (int): Primary key of the Pageview.

        Returns:
            Pageview | None: The requested Pageview if found, otherwise None.
        """
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Pageview]:
        """
        Retrieve all Pageviews.

        Returns:
            Iterable[Pageview]: All stored Pageviews.
        """
        pass

    @abstractmethod
    def get_top_species_by_language(
        self, language_code: str, limit: int = 20
    ) -> list[tuple[Species, int]]:
        """
        Retrieve top species by total pageviews for a given language.

        Args:
            language_code (str): The ISO 639 code of the language to filter pageviews by.
            limit (int): Maximum number of species to return.

        Returns:
            list[tuple[Species, int]]: List of tuples containing the Species object and its total
            pageviews, ordered descending by pageviews.
        """
        pass

    @abstractmethod
    def get_total_pageviews_by_language(
        self, month: str | None = None
    ) -> list[tuple[Language, int]]:
        """
        Retrieve all languages with their total pageviews with optional filter by month.

        Args:
            month (str | None): Optional month filter in 'YYYY-MM' format.

        Returns:
            list[tuple[str, int]]: List of tuples (language_code, total_pageviews)
            pageviews
        """
        pass

    @abstractmethod
    def create(
        self,
        timestamp_ID: int,
        language_ID: int,
        species_ID: int,
        number_of_pageviews: int,
    ) -> Pageview:
        """
        Create and persist a new Pageview.

        Args:
            timestamp_ID (int): ID of the associated Timestamp.
            language_ID (int): ID of the associated Language.
            species_ID (int): ID of the associated Species.
            number_of_pageviews (int): Recorded number of pageviews.

        Returns:
            Pageview: The newly created Pageview.
        """
        pass
