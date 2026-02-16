from db.dao.abstract import PageviewDAO

class PageviewService:

    def __init__(self, pageview_dao: PageviewDAO):
        self.pageview_dao = pageview_dao

    def add_pageview(
        self, timestamp_ID: int, language_ID: int, species_ID: int, number_of_pageviews: int
    ):
        return self.pageview_dao.create(
            timestamp_ID=timestamp_ID,
            language_ID=language_ID,
            species_ID=species_ID,
            number_of_pageviews=number_of_pageviews
        )