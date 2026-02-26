import datetime

from sqlalchemy.orm import Session
from db.models import Timestamp
from db.dao.abstract import TimestampDAO

class SQLAlchemyTimestampDAO(TimestampDAO):

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, timestamp_ID: int) -> Timestamp | None:
        return self.session.get(Timestamp, timestamp_ID)

    def get_all(self):
        return self.session.query(Timestamp).all()

    def create(self, time: datetime.datetime) -> Timestamp:
        timestamp = Timestamp(time=time)
        self.session.add(timestamp)
        self.session.commit()
        return timestamp
