import datetime


from db_module.dao.abstract import TimestampDAO

class TimestampService:

    def __init__(self, timestamp_dao: TimestampDAO):
        self.timestamp_dao = timestamp_dao

    def get_available_months(self) -> list[str]:
        """
        Get available months for UI selection.

        Returns:
            list[str]: List of months in 'YYYY-MM' format.
        """
        return self.timestamp_dao.get_available_months()

    def add_timestamp(self, time: datetime.datetime):
        return self.timestamp_dao.create(time)

    def add_many_timestamps(self, times: list[datetime.datetime]):
        return self.timestamp_dao.create_many(times)
