from sqlalchemy import func
from sqlalchemy.orm import Session
from db_module.models import Pageview, Language, Species, Timestamp
from db_module.dao.abstract import PageviewDAO


class SQLAlchemyPageviewDAO(PageviewDAO):
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, pageview_id: int) -> Pageview | None:
        return self.session.get(Pageview, pageview_id)

    def get_all(self):
        return self.session.query(Pageview).all()

    def get_top_species_by_language(
        self,
        language_code: str,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
    ) -> list[tuple[int, str, int]]:
        query = (
            self.session.query(
                Species.id,
                Species.latin_name,
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Pageview, Species.id == Pageview.species_id)
            .join(Language, Pageview.language_id == Language.id)
            .join(Timestamp, Pageview.timestamp_id == Timestamp.id)
            .filter(Language.iso_639_3 == language_code)
        )

        if start_month:
            query = query.filter(func.to_char(Timestamp.time, "YYYY-MM") >= start_month)

        if end_month:
            query = query.filter(func.to_char(Timestamp.time, "YYYY-MM") <= end_month)

        query = (
            query.group_by(Species.id, Species.latin_name)
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
            .join(Pageview, Language.id == Pageview.language_id)
            .join(Timestamp, Pageview.timestamp_id == Timestamp.id)
        )

        if month:
            query = query.filter(func.to_char(Timestamp.time, "YYYY-MM") == month)

        query = query.group_by(Language.name)

        results = query.all()
        return [(lang, total or 0) for lang, total in results]

    def create(
        self,
        timestamp_id: int,
        language_id: int,
        species_id: int,
        number_of_pageviews: int,
    ) -> Pageview:
        pageview = Pageview(
            timestamp_id=timestamp_id,
            language_id=language_id,
            species_id=species_id,
            number_of_pageviews=number_of_pageviews,
        )
        self.session.add(pageview)
        self.session.commit()
        return pageview
