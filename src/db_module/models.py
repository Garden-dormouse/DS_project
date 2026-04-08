"""
ORM model definitions for the database schema.

This module contains SQLAlchemy object-relational mapping (ORM) mappings for all database tables
used by the application. Each class corresponds to a table in the database and defines both column
mappings and relationships between tables.
"""

import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, BigInteger, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class Species(Base):
    """
    ORM model that maps to the 'species' table in the database.
    """

    __tablename__ = "species"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    latin_name: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)

    pageviews = relationship("Pageview", back_populates="species")
    # ranges = relationship("SpeciesRange", back_populates="species")  # Add when Species_Ranges table exists


class Language(Base):
    """
    ORM model that maps to the 'languages' table in the database.
    """

    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    iso_639_3: Mapped[str] = mapped_column(String)
    language_range: Mapped[str] = mapped_column(String)

    pageviews = relationship("Pageview", back_populates="language")
    # regions = relationship("LanguageRegion", back_populates="language")  # Add when Language_Regions table exists


class Timestamp(Base):
    """
    ORM model that maps to the 'timestamps' table in the database.
    """

    __tablename__ = "timestamps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    time: Mapped[datetime.datetime] = mapped_column(DateTime)

    pageviews = relationship("Pageview", back_populates="timestamp")


class Pageview(Base):
    """
    ORM model that maps to the 'pageviews' table in the database. Each pageview record links a
    timestamp, language, and species to a recorded number of pageviews.
    """

    __tablename__ = "pageviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("timestamps.id")
    )
    language_id: Mapped[int] = mapped_column(Integer, ForeignKey("languages.id"))
    number_of_pageviews: Mapped[int] = mapped_column(Integer)
    species_id: Mapped[int] = mapped_column(Integer, ForeignKey("species.id"))

    timestamp: Mapped["Timestamp"] = relationship(
        "Timestamp", back_populates="pageviews"
    )
    language: Mapped["Language"] = relationship("Language", back_populates="pageviews")
    species: Mapped["Species"] = relationship("Species", back_populates="pageviews")


class MonthlyLanguagePageview(Base):
    """Read-only ORM model for the mv_monthly_language_pageviews materialized view."""

    __tablename__ = "mv_monthly_language_pageviews"

    language_code: Mapped[str] = mapped_column(String, primary_key=True)
    month: Mapped[datetime.date] = mapped_column(Date, primary_key=True)
    species_type: Mapped[str] = mapped_column(String, primary_key=True)
    total_pageviews: Mapped[int] = mapped_column(BigInteger)


class MonthlySpeciesPageview(Base):
    """Read-only ORM model for the mv_monthly_species_pageviews materialized view."""

    __tablename__ = "mv_monthly_species_pageviews"

    species_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    latin_name: Mapped[str] = mapped_column(String)
    species_type: Mapped[str] = mapped_column(String)
    language_code: Mapped[str] = mapped_column(String, primary_key=True)
    language_name: Mapped[str] = mapped_column(String)
    month: Mapped[datetime.date] = mapped_column(Date, primary_key=True)
    total_pageviews: Mapped[int] = mapped_column(BigInteger)
