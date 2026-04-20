from datetime import date
from io import StringIO

from sqlalchemy import func, insert
from sqlalchemy.orm import Session

from db_module.dao.abstract import PageviewDAO
from db_module.models import Pageview, MonthlyLanguagePageview, MonthlySpeciesPageview


def _month_range(month_str: str) -> tuple[date, date]:
    """Convert YYYY-MM string to (start_date, end_date) for the month."""
    year, month_num = map(int, month_str.split("-"))
    start = date(year, month_num, 1)
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
    ) -> list[tuple[int, str, str, int]]:
        mv = MonthlySpeciesPageview
        query = (
            self.session.query(
                mv.species_id,
                mv.latin_name,
                mv.species_type,
                func.sum(mv.total_pageviews).label("total_pageviews"),
            )
            .filter(mv.language_code == language_code)
        )

        if start_month:
            start_date, _ = _month_range(start_month)
            query = query.filter(mv.month >= start_date)

        if end_month:
            _, end_date = _month_range(end_month)
            query = query.filter(mv.month < end_date)

        if species_type:
            query = query.filter(mv.species_type == species_type)

        query = (
            query.group_by(mv.species_id, mv.latin_name, mv.species_type)
            .order_by(func.sum(mv.total_pageviews).desc())
            .limit(limit)
        )

        results = query.all()
        return [
            (species_id, latin_name, species_type_value, total_pageviews or 0)
            for species_id, latin_name, species_type_value, total_pageviews in results
        ]

    def get_top_languages_by_species(
        self,
        species_id: int,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, str, int]]:
        mv = MonthlySpeciesPageview
        query = (
            self.session.query(
                mv.language_code,
                mv.language_name,
                func.sum(mv.total_pageviews).label("total_pageviews"),
            )
            .filter(mv.species_id == species_id)
        )

        if start_month:
            start_date, _ = _month_range(start_month)
            query = query.filter(mv.month >= start_date)

        if end_month:
            _, end_date = _month_range(end_month)
            query = query.filter(mv.month < end_date)

        if species_type:
            query = query.filter(mv.species_type == species_type)

        query = (
            query.group_by(mv.language_code, mv.language_name)
            .order_by(func.sum(mv.total_pageviews).desc())
            .limit(limit)
        )

        results = query.all()
        return [
            (language_code, language_name, total_pageviews or 0)
            for language_code, language_name, total_pageviews in results
            if language_code
        ]

    def get_timeseries_by_language(
        self,
        language_code: str,
        species_id: int | None = None,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ) -> list[tuple[str, int]]:
        mv = MonthlySpeciesPageview
        month_label = func.to_char(mv.month, "YYYY-MM")

        query = (
            self.session.query(
                month_label.label("month"),
                func.sum(mv.total_pageviews).label("total_pageviews"),
            )
            .filter(mv.language_code == language_code)
        )

        if species_id is not None:
            query = query.filter(mv.species_id == species_id)

        if start_month:
            start_date, _ = _month_range(start_month)
            query = query.filter(mv.month >= start_date)

        if end_month:
            _, end_date = _month_range(end_month)
            query = query.filter(mv.month < end_date)

        if species_type:
            query = query.filter(mv.species_type == species_type)

        query = query.group_by(month_label).order_by(month_label.asc())

        results = query.all()
        return [(month, total or 0) for month, total in results if month]

    def get_total_pageviews_by_language(
        self,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
        species_id: int | None = None,
    ) -> list[tuple[str, int]]:
        mv = MonthlyLanguagePageview
        query = (
            self.session.query(
                mv.language_code,
                func.sum(mv.total_pageviews).label("total_pageviews"),
            )
        )

        if start_month:
            start_date, _ = _month_range(start_month)
            query = query.filter(mv.month >= start_date)

        if end_month:
            _, end_date = _month_range(end_month)
            query = query.filter(mv.month < end_date)

        if species_type:
            query = query.filter(mv.species_type == species_type)

        if species_id is not None:
            mv2 = MonthlySpeciesPageview
            query = (
                self.session.query(
                    mv2.language_code,
                    func.sum(mv2.total_pageviews).label("total_pageviews"),
                )
            )
            if start_month:
                start_date, _ = _month_range(start_month)
                query = query.filter(mv2.month >= start_date)
            if end_month:
                _, end_date = _month_range(end_month)
                query = query.filter(mv2.month < end_date)
            if species_type:
                query = query.filter(mv2.species_type == species_type)
            query = query.filter(mv2.species_id == species_id)
            query = query.group_by(mv2.language_code)
            results = query.all()
            return [(lang, total or 0) for lang, total in results if lang]

        query = query.group_by(mv.language_code)

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
        if not pageviews_list:
            return []

        bind = self.session.get_bind()
        if bind is not None and bind.dialect.name == "postgresql":
            copy_buffer = StringIO()
            for timestamp_id, language_id, species_id, number_of_pageviews in pageviews_list:
                copy_buffer.write(
                    f"{timestamp_id}\t{language_id}\t{species_id}\t{number_of_pageviews}\n"
                )
            copy_buffer.seek(0)

            raw_connection = self.session.connection().connection
            with raw_connection.cursor() as cursor:
                cursor.copy_from(
                    copy_buffer,
                    "pageviews",
                    columns=(
                        "timestamp_id",
                        "language_id",
                        "species_id",
                        "number_of_pageviews",
                    ),
                )
            self.session.commit()
            return []

        payload = [
            {
                "timestamp_id": timestamp_id,
                "language_id": language_id,
                "species_id": species_id,
                "number_of_pageviews": number_of_pageviews,
            }
            for timestamp_id, language_id, species_id, number_of_pageviews in pageviews_list
        ]
        self.session.execute(insert(Pageview), payload)
        self.session.commit()
        return []