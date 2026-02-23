"""
Service layer for Timestamp operations.

This module contains business logic related to Timestamp objects. Services coordinate one or more
DAOs and enforce application-level rules, validations, and workflows.
"""

import datetime
from db.dao.abstract import TimestampDAO

class TimestampService:
    """
    Service providing business logic for Timestamp entities.

    This class acts as an intermediary between the application layer and the data access layer.
    """

    def __init__(self, timestamp_dao: TimestampDAO):
        """
        Initialize the service with a DAO dependency.

        Args:
            timestamp_dao (TimestampDAO): Data access object for Timestamp.
        """
        self.timestamp_dao = timestamp_dao

    def add_timestamp(self, time: datetime.datetime):
        """
        Create and persist a new Timestamp.

        Args:
            time (datetime.datetime): The time of the Timestamp.

        Returns:
            Timestamp: The newly created Timestamp.
        """
        return self.timestamp_dao.create(time)