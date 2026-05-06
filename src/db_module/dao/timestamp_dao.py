import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session
from db_module.models import Timestamp
from db_module.dao.abstract import TimestampDAO


class SQLAlchemyTimestampDAO(TimestampDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, timestamp_id: int) -> Timestamp | None:
        return self.session.get(Timestamp, timestamp_id)

    def get_all(self):
        return self.session.query(Timestamp).all()

    def get_available_months(self) -> list[str]:
        query = self.session.query(
            func.distinct(func.to_char(Timestamp.time, "YYYY-MM")).label("month")
        ).order_by("month")

        results = query.all()
        return [row.month for row in results if row.month]

    def create(self, time: datetime.datetime) -> Timestamp:
        timestamp = Timestamp(time=time)
        self.session.add(timestamp)
        self.session.commit()
        return timestamp

    def create_many(self, times: list[datetime.datetime]) -> list[Timestamp]:
        if not times:
            return []

        unique_times = list(dict.fromkeys(times))
        existing_times = {
            row.time
            for row in self.session.query(Timestamp.time)
            .filter(Timestamp.time.in_(unique_times))
            .all()
            if row.time is not None
        }

        timestamp_objects = [
            Timestamp(time=t)
            for t in unique_times
            if t is not None and t not in existing_times
        ]

        if timestamp_objects:
            self.session.add_all(timestamp_objects)
            self.session.commit()

        return timestamp_objects
