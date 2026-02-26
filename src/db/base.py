"""
Base declarative class for all SQLAlchemy object-relational mapping (ORM) models.

This module defines the common SQLAlchemy DeclarativeBase that all ORM-mapped classes in the
application must inherit from. Having a single shared base allows SQLAlchemy to manage metadata and
mappings consistently across the project.
"""

from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    Common declarative base class for all ORM models.

    All database models should inherit from this class to ensure they are registered with the same
    SQLAlchemy metadata registry.
    """
    pass
