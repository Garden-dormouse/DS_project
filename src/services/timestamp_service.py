import datetime

from db.dao.abstract import TimestampDAO

class TimestampService:

    def __init__(self, timestamp_dao: TimestampDAO):
        self.timestamp_dao = timestamp_dao

    def add_timestamp(self, time: datetime.datetime):
        return self.timestamp_dao.create(time)