from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from db_module.dao.abstract import PageviewDAO
from db_module.models import Language, Pageview, Species, Timestamp


def _month_range(month_str: str) -> tuple[date, date]:
    """Convert YYYY-MM string to (start_date, end_date) for the month."""
    year, month_num = map(int, month_str.split("-"))
    start = date(year, month_num, 1)
    # End of month is first day of next month (exclusive)
    if month_num == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month_num + 1, 1)
    return start, end


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
        species_type: str | None = None,
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
            start_date, _ = _month_range(start_month)
            query = query.filter(Timestamp.time >= start_date)

        if end_month:
            _, end_date = _month_range(end_month)
            query = query.filter(Timestamp.time < end_date)

        if species_type:
            query = query.filter(Species.type == species_type)

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

    def get_timeseries_by_language(
        self,
        language_code: str,
        species_id: int | None = None,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, int]]:
        month_label = func.to_char(Timestamp.time, "YYYY-MM")

        query = (
            self.session.query(
                month_label.label("month"),
                func.sum(Pageview.number_of_pageviews).label("total_pageviews"),
            )
            .join(Language, Pageview.language_id == Language.id)
            .join(Timestamp, Pageview.timestamp_id == Timestamp.id)
            .join(Species, Pageview.species_id == Species.id)
            .filter(Language.iso_639_3 == language_code)
        )

        if species_id is not None:
            query = query.filter(Species.id == species_id)

        if start_month:
            start_date, _ = _month_range(start_month)
            query = query.filter(Timestamp.time >= start_date)

        if end_month:
            _, end_date = _month_range(end_month)
            query = query.filter(Timestamp.time < end_date)

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
            .join(Pageview, Language.id == Pageview.language_id)
            .join(Timestamp, Pageview.timestamp_id == Timestamp.id)
            .join(Species, Pageview.species_id == Species.id)
        )

        if month:
            start_date, end_date = _month_range(month)
            query = query.filter(Timestamp.time >= start_date)
            query = query.filter(Timestamp.time < end_date)

        if species_type:
            query = query.filter(Species.type == species_type)

        query = query.group_by(Language.iso_639_3)

        results = query.all()
        return [(lang, total or 0) for lang, total in results if lang]

    def create_single(
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

    def create_many(
        self,
        pageviews_list: list[tuple[int, int, int, int]],
    ) -> list[Pageview]:
        pageviews = [
            Pageview(
                timestamp_id=timestamp_id,
                language_id=language_id,
                species_id=species_id,
                number_of_pageviews=number_of_pageviews,
            )
            for timestamp_id, language_id, species_id, number_of_pageviews in pageviews_list
        ]
        self.session.add_all(pageviews)
        self.session.commit()
        return pageviews
