from sqlalchemy import func
from sqlalchemy.orm import Session
from db_module.models import Pageview, Language, Species, Timestamp
from db_module.dao.abstract import PageviewDAO


class SQLAlchemyPageviewDAO(PageviewDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, pageview_ID: int) -> Pageview | None:
        return self.session.get(Pageview, pageview_ID)

    def get_all(self):
        return self.session.query(Pageview).all()

    def get_top_species_by_language(
        self, language_code: str, limit: int = 20
    ) -> list[tuple[int, str, int]]:
        query = (
            self.session.query(
                Species.ID,
                Species.latin_name,
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Pageview, Species.ID == Pageview.species_ID)
            .join(Language, Pageview.language_ID == Language.ID)
            .filter(Language.iso_639_3 == language_code)
            .group_by(Species.ID, Species.latin_name)
            .order_by(func.sum(Pageview.number_of_pageviews).desc())
            .limit(limit)
        )

        results = query.all()
        return [
            (species_id, latin_name, total_pageviews or 0)
            for species_id, latin_name, total_pageviews in results
        ]

    def get_total_pageviews_by_language(
        self, month: str | None = None
    ) -> list[tuple[str, int]]:
        query = (
            self.session.query(
                Language.name,
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Pageview, Language.ID == Pageview.language_ID)
            .join(Timestamp, Pageview.timestamp_ID == Timestamp.ID)
        )

        if month:
            query = query.filter(func.strftime("%Y-%m", Timestamp.time) == month)

        query = query.group_by(Language.name)

        results = query.all()
        return [(lang, total or 0) for lang, total in results]

    def create(
        self,
        timestamp_ID: int,
        language_ID: int,
        species_ID: int,
        number_of_pageviews: int,
    ) -> Pageview:
        pageview = Pageview(
            timestamp_ID=timestamp_ID,
            language_ID=language_ID,
            species_ID=species_ID,
            number_of_pageviews=number_of_pageviews,
        )
        self.session.add(pageview)
        self.session.commit()
        return pageview
