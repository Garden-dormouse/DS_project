"""
ORM model definitions for the database schema.

This module contains SQLAlchemy object-relational mapping (ORM) mappings for all database tables
used by the application. Each class corresponds to a table in the database and defines both column
mappings and relationships between tables.
"""

import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Species(Base):
    """
    ORM model that maps to the 'Species' table in the database.
    """
    __tablename__ = "Species"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    latin_name: Mapped[str] = mapped_column("Latin_name", String)

    pageviews = relationship("Pageview", back_populates="species")
    # ranges = relationship("SpeciesRange", back_populates="species")  # Add when Species_Ranges table exists

class Language(Base):
    """
    ORM model that maps to the 'Languges' table in the database.
    """
    __tablename__ = "Languages"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    name: Mapped[str] = mapped_column("Name", String)
    iso_639_3: Mapped[str] = mapped_column("ISO_639_3", String)
    glottocode: Mapped[str] = mapped_column("Glottocode", String)

    pageviews = relationship("Pageview", back_populates="language")
    # regions = relationship("LanguageRegion", back_populates="language")  # Add when Language_Regions table exists

class Timestamp(Base):
    """
    ORM model that maps to the 'Timestamps' table in the database.
    """
    __tablename__ = "Timestamps"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    time: Mapped[datetime.datetime] = mapped_column("Time", DateTime)

    pageviews = relationship("Pageview", back_populates="timestamp")

class Pageview(Base):
    """
    ORM model that maps to the 'Pageviews' table in the database. Each pageview record links a
    timestamp, language, and species to a recorded number of pageviews.
    """
    __tablename__ = "Pageviews"

    ID: Mapped[int] = mapped_column("ID", Integer, primary_key=True)
    timestamp_ID: Mapped[int] = mapped_column("Timestamp_ID", ForeignKey("Timestamps.ID"))
    language_ID: Mapped[int] = mapped_column("Language_ID", ForeignKey("Languages.ID"))
    number_of_pageviews: Mapped[int] = mapped_column("Number_of_Pageviews", Integer)
    species_ID: Mapped[int] = mapped_column("Species_ID", ForeignKey("Species.ID"))

    timestamp: Mapped["Timestamp"] = relationship("Timestamp", back_populates="pageviews")
    language: Mapped["Language"] = relationship("Language", back_populates="pageviews")
    species: Mapped["Species"] = relationship("Species", back_populates="pageviews")
