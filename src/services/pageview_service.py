from db_module.dao.abstract import PageviewDAO


class PageviewService:
    def __init__(self, pageview_dao: PageviewDAO):
        self.pageview_dao = pageview_dao

    def get_top_species_for_language(
        self,
        language_code: str,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ):
        top_species = self.pageview_dao.get_top_species_by_language(
            language_code=language_code,
            limit=limit,
            start_month=start_month,
            end_month=end_month,
            species_type=species_type,
        )
        return [
            {
                "id": species_id,
                "latin_name": latin_name,
                "type": species_type_value,
                "pageviews": int(total),
            }
            for species_id, latin_name, species_type_value, total in top_species
        ]

    def get_top_languages_for_species(
        self,
        species_id: int,
        limit: int = 20,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ):
        rows = self.pageview_dao.get_top_languages_by_species(
            species_id=species_id,
            limit=limit,
            start_month=start_month,
            end_month=end_month,
            species_type=species_type,
        )
        return [
            {
                "code": language_code,
                "name": language_name,
                "pageviews": int(total),
            }
            for language_code, language_name, total in rows
        ]

    def get_timeseries(
        self,
        language_code: str,
        species_id: int | None = None,
        start_month: str | None = None,
        end_month: str | None = None,
        species_type: str | None = None,
    ):
        rows = self.pageview_dao.get_timeseries_by_language(
            language_code=language_code,
            species_id=species_id,
            start_month=start_month,
            end_month=end_month,
            species_type=species_type,
        )

        return [{"month": month, "pageviews": int(total)} for month, total in rows]

    def get_languages_map_data(
        self,
        month: str | None = None,
        species_type: str | None = None,
        species_id: int | None = None,
    ) -> dict[str, int]:
        raw_results = self.pageview_dao.get_total_pageviews_by_language(
            month=month,
            species_type=species_type,
            species_id=species_id,
        )

        return {lang: int(total) for lang, total in raw_results if lang}

    def add_pageview(
        self,
        timestamp_id: int,
        language_id: int,
        species_id: int,
        number_of_pageviews: int,
    ):
        return self.pageview_dao.create_single(
            timestamp_id=timestamp_id,
            language_id=language_id,
            species_id=species_id,
            number_of_pageviews=number_of_pageviews,
        )

    def add_many_pageviews(self, pageviews_list: list[tuple[int, int, int, int]]):
        return self.pageview_dao.create_many(pageviews_list)