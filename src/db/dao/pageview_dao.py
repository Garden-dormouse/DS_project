from sqlalchemy.orm import Session
from db.models import Pageview
from db.dao.abstract import PageviewDAO

class SQLAlchemyPageviewDAO(PageviewDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, pageview_ID: int) -> Pageview | None:
        return self.session.get(Pageview, pageview_ID)

    def get_all(self):
        return self.session.query(Pageview).all()

    def create(
        self, timestamp_ID: int, language_ID: int, species_ID:int, number_of_pageviews: int
    ) -> Pageview:
        pageview = Pageview(
            timestamp_ID=timestamp_ID,
            language_ID=language_ID,
            species_ID=species_ID,
            number_of_pageviews=number_of_pageviews
        )
        self.session.add(pageview)
        self.session.commit()
        return pageview
