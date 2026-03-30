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
