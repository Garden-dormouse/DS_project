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
        self,
        language_code: str,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[int, str, int]]:
        query = (
            self.session.query(
                Species.ID,
                Species.latin_name,
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Pageview, Species.ID == Pageview.species_ID)
            .join(Language, Pageview.language_ID == Language.ID)
            .join(Timestamp, Pageview.timestamp_ID == Timestamp.ID)
            .filter(Language.iso_639_3 == language_code)
        )

        if start_month:
            query = query.filter(func.strftime("%Y-%m", Timestamp.time) >= start_month)

        if end_month:
            query = query.filter(func.strftime("%Y-%m", Timestamp.time) <= end_month)

        if species_type:
            query = query.filter(Species.type == species_type)

        query = (
            query.group_by(Species.ID, Species.latin_name)
            .order_by(func.sum(Pageview.number_of_pageviews).desc())
            .limit(limit)
        )

        results = query.all()
        return [
            (species_id, latin_name, total_pageviews or 0)
            for species_id, latin_name, total_pageviews in results
        ]

    def get_timeseries_by_language(
        self,
        language_code: str,
        species_id: int | None = None,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, int]]:
        month_label = func.strftime("%Y-%m", Timestamp.time)

        query = (
            self.session.query(
                month_label.label("month"),
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Language, Pageview.language_ID == Language.ID)
            .join(Timestamp, Pageview.timestamp_ID == Timestamp.ID)
            .join(Species, Pageview.species_ID == Species.ID)
            .filter(Language.iso_639_3 == language_code)
        )

        if species_id is not None:
            query = query.filter(Species.ID == species_id)

        if start_month:
            query = query.filter(month_label >= start_month)

        if end_month:
            query = query.filter(month_label <= end_month)

        if species_type:
            query = query.filter(Species.type == species_type)

        query = query.group_by(month_label).order_by(month_label.asc())

        results = query.all()
        return [(month, total or 0) for month, total in results if month]

    def get_total_pageviews_by_language(
        self,
        month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, int]]:
        query = (
            self.session.query(
                Language.iso_639_3,
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Pageview, Language.ID == Pageview.language_ID)
            .join(Timestamp, Pageview.timestamp_ID == Timestamp.ID)
            .join(Species, Pageview.species_ID == Species.ID)
        )

        if month:
            query = query.filter(func.strftime("%Y-%m", Timestamp.time) == month)

        if species_type:
            query = query.filter(Species.type == species_type)

        query = query.group_by(Language.iso_639_3)

        results = query.all()
        return [(lang, total or 0) for lang, total in results if lang]

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