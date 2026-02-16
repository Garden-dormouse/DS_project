import datetime

from abc import ABC, abstractmethod
from typing import Iterable
from db.models import Species, Language, Timestamp, Pageview

class SpeciesDAO(ABC):

    @abstractmethod
    def get_by_id(self, species_ID: int) -> Species | None:
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Species]:
        pass

    @abstractmethod
    def create(self, latin_name: str) -> Species:
        pass

class LanguageDAO(ABC):

    @abstractmethod
    def get_by_id(self, language_ID: int) -> Language | None:
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Language]:
        pass

    @abstractmethod
    def create(self, name: str) -> Language:
        pass

class TimestampDAO(ABC):

    @abstractmethod
    def get_by_id(self, timestamp_ID: int) -> Timestamp | None:
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Timestamp]:
        pass

    @abstractmethod
    def create(self, time: datetime.datetime) -> Timestamp:
        pass

class PageviewDAO(ABC):

    @abstractmethod
    def get_by_id(self, pageview_ID: int) -> Pageview | None:
        pass

    @abstractmethod
    def get_all(self) -> Iterable[Pageview]:
        pass

    @abstractmethod
    def create(
        self, timestamp_ID: int, language_ID: int, species_ID: int, number_of_pageviews: int
    ) -> Pageview:
        pass
