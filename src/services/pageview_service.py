"""
Service layer for Pageview operations.

This module contains business logic related to Pageview objects. Services coordinate one or more
DAOs and enforce application-level rules, validations, and workflows.
"""

from db.dao.abstract import PageviewDAO

class PageviewService:
    """
    Service providing business logic for Pageview entities.

    This class acts as an intermediary between the application layer and the data access layer.
    """

    def __init__(self, pageview_dao: PageviewDAO):
        """
        Initialize the service with a DAO dependency.

        Args:
            pageview_dao (PageviewDAO): Data access object for Pageview.
        """
        self.pageview_dao = pageview_dao

    def add_pageview(
        self, timestamp_ID: int, language_ID: int, species_ID: int, number_of_pageviews: int
    ):
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
        return self.pageview_dao.create(
            timestamp_ID=timestamp_ID,
            language_ID=language_ID,
            species_ID=species_ID,
            number_of_pageviews=number_of_pageviews
        )
