"""
Abstract DAO interfaces for database access.

This module defines abstract base classes (ABCs) that specify the contract for data access objects
(DAOs). Concrete implementations must implement these interfaces.
"""

import datetime
from abc import ABC, abstractmethod
from typing import Iterable

from db_module.models import Language, Pageview, Species, Timestamp


class SpeciesDAO(ABC):
    """
    Abstract data access interface for Species objects.

    Implementations of this interface are responsible for adding and retrieving Species records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, species_id: int) -> Species | None:
        """
        Retrieve a Species by its primary key.

        Args:
            species_id (int): Primary key of the Species.

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
    def create_single(self, latin_name: str, species_type: str) -> Species:
        """
        Create and persist a new Species.

        Args:
            latin_name (str): The Latin name of the species.
            species_type (str): The type of the species (e.g., 'reptile', 'bird', 'mammals').

        Returns:
            Species: The newly created Species.
        """
        pass

    def create_many(self, species_list: list[tuple[str, str]]) -> list[Species]:
        """
        Create and persist multiple Species.

        Args:
            species_list (list[tuple[str, str]]): A list of (latin_name, species_type) tuples.

        Returns:
            list[Species]: The newly created Species objects.
        """
        pass


class LanguageDAO(ABC):
    """
    Abstract data access interface for Language objects.

    Implementations of this interface are responsible for adding and retrieving Language records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, language_id: int) -> Language | None:
        """
        Retrieve a Language by its primary key.

        Args:
            language_id (int): Primary key of the Language.

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
            glottocode (str): The Glottolog code for the language.

        Returns:
            Language: The newly created Language.
        """
        pass

    @abstractmethod
    def create_many(
        self, languages_list: list[tuple[str, str, str]]
    ) -> list[Language]:
        """
        Create and persist multiple Languages.

        Args:
            languages_list (list[tuple[str, str, str]]):
                List of (name, iso_639_3, language_range) tuples.

        Returns:
            list[Language]: Newly created Language objects.
        """
        pass


class TimestampDAO(ABC):
    """
    Abstract data access interface for Timestamp objects.

    Implementations of this interface are responsible for adding and retrieving Timestamp records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, timestamp_id: int) -> Timestamp | None:
        """
        Retrieve a Timestamp by its primary key.

        Args:
            timestamp_id (int): Primary key of the Timestamp.

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

    @abstractmethod
    def create_many(self, times: list[datetime.datetime]) -> list[Timestamp]:
        """
        Create and persist multiple Timestamps.

        Args:
            times (list[datetime.datetime]): Timestamp values to insert.

        Returns:
            list[Timestamp]: Newly created Timestamp objects.
        """
        pass


class PageviewDAO(ABC):
    """
    Abstract data access interface for Pageview objects.

    Implementations of this interface are responsible for adding and retrieving Pageview records
    from the database.
    """

    @abstractmethod
    def get_by_id(self, pageview_id: int) -> Pageview | None:
        """
        Retrieve a Pageview by its primary key.

        Args:
            pageview_id (int): Primary key of the Pageview.

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
        self,
        language_code: str,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[int, str, str, int]]:
        """
        Retrieve top species by total pageviews for a given language.

        Args:
            language_code (str): The ISO 639-3 code of the language to filter pageviews by.
            limit (int): Maximum number of species to return.
            start_month (str | None): Optional start month in 'YYYY-MM' format (inclusive).
            end_month (str | None): Optional end month in 'YYYY-MM' format (exclusive).
            species_type (str | None): Optional species type filter (e.g., 'mammal', 'bird', 'reptile').

        Returns:
            list[tuple[int, str, str, int]]: List of tuples
                (species_id, latin_name, species_type, total_pageviews),
                ordered descending by pageviews.
        """
        pass

    @abstractmethod
    def get_top_languages_by_species(
        self,
        species_id: int,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, str, int]]:
        """
        Retrieve top languages by total pageviews for a given species.

        Args:
            species_id (int): The primary key of the species to filter pageviews by.
            limit (int): Maximum number of languages to return.
            start_month (str | None): Optional start month in 'YYYY-MM' format (inclusive).
            end_month (str | None): Optional end month in 'YYYY-MM' format (exclusive).
            species_type (str | None): Optional species type filter (e.g., 'mammal', 'bird', 'reptile').

        Returns:
            list[tuple[str, str, int]]: List of tuples
                (language_code, language_name, total_pageviews),
                ordered descending by pageviews.
        """
        pass

    @abstractmethod
    def get_timeseries_by_language(
        self,
        language_code: str,
        species_id: int | None = None,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, int]]:
        """
        Retrieve monthly pageview totals for a given language.

        Args:
            language_code (str): The ISO 639-3 code of the language.
            species_id (int | None): Optional species ID to filter by a specific species.
            start_month (str | None): Optional start month in 'YYYY-MM' format (inclusive).
            end_month (str | None): Optional end month in 'YYYY-MM' format (exclusive).
            species_type (str | None): Optional species type filter (e.g., 'mammal', 'bird', 'reptile').

        Returns:
            list[tuple[str, int]]: List of tuples (month, total_pageviews),
                where month is in 'YYYY-MM' format, ordered ascending by month.
        """
        pass

    @abstractmethod
    def get_total_pageviews_by_language(
        self,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
        species_id: int | None = None,
    ) -> list[tuple[str, int]]:
        """
        Retrieve all languages with their total pageviews, with optional filters.

        Args:
            start_month (str | None): Optional start month in 'YYYY-MM' format (inclusive).
            end_month (str | None): Optional end month in 'YYYY-MM' format (inclusive).
            species_type (str | None): Optional species type filter (e.g., 'mammal', 'bird', 'reptile').
            species_id (int | None): Optional species ID to filter by a specific species.

        Returns:
            list[tuple[str, int]]: List of tuples (language_code, total_pageviews).
        """
        pass

    @abstractmethod
    def create_single(
        self,
        timestamp_id: int,
        language_id: int,
        species_id: int,
        number_of_pageviews: int,
    ) -> Pageview:
        """
        Create and persist a new Pageview.

        Args:
            timestamp_id (int): ID of the associated Timestamp.
            language_id (int): ID of the associated Language.
            species_id (int): ID of the associated Species.
            number_of_pageviews (int): Recorded number of pageviews.

        Returns:
            Pageview: The newly created Pageview.
        """
        pass

    @abstractmethod
    def create_many(
        self,
        pageviews_list: list[tuple[int, int, int, int]],
    ) -> list[Pageview]:
        """
        Create and persist multiple Pageviews.

        Args:
            pageviews_list (list[tuple[int, int, int, int]]): List of tuples containing
                (timestamp_ID, language_ID, species_ID, number_of_pageviews).

        Returns:
            list[Pageview]: The newly created Pageviews.
        """
        pass
