import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Species(Base):
    __tablename__ = "Species"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    latin_name: Mapped[str] = mapped_column("Latin_name", String)

    pageviews = relationship("Pageview", back_populates="species")

class Language(Base):
    __tablename__ = "Languages"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    name: Mapped[str] = mapped_column("Name", String)

    pageviews = relationship("Pageview", back_populates="language")

class Timestamp(Base):
    __tablename__ = "Timestamps"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    time: Mapped[datetime.datetime] = mapped_column("Time", DateTime)

    pageviews = relationship("Pageview", back_populates="timestamp")

class Pageview(Base):
    __tablename__ = "Pageviews"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    timestamp_ID: Mapped[int] = mapped_column("Timestamp_ID", ForeignKey("Timestamps.ID"))
    language_ID: Mapped[int] = mapped_column("Language_ID", ForeignKey("Languages.ID"))
    number_of_pageviews: Mapped[int] = mapped_column("Number_of_Pageviews", Integer)
    species_ID: Mapped[int] = mapped_column("Species_ID", ForeignKey("Species.ID"))

    timestamp: Mapped["Timestamp"] = relationship("Timestamp", back_populates="pageviews")
    language: Mapped["Language"] = relationship("Language", back_populates="pageviews")
    species: Mapped["Species"] = relationship("Species", back_populates="pageviews")
