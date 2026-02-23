"""
Database engine and session factory utilities.

This module provides helper functions for creating SQLAlchemy engines and session factories in a
database-agnostic way.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_engine(db_url: str):
    """
    Create an SQLAlchemy engine for the given database URL.

    Args:
        db_url (str): SQLAlchemy database URL.

    Returns:
        Engine: Configured SQLAlchemy engine.
    """
    return create_engine(db_url)

def get_session_factory(engine):
    """
    Create a SQLAlchemy session factory bound to an engine.

    Args:
        engine (Engine): SQLAlchemy engine instance.

    Returns:
        sessionmaker: Configured session factory.
    """
    return sessionmaker(bind=engine, expire_on_commit=False)
