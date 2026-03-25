import unittest
from unittest.mock import Mock
import datetime

import os, sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from services.pageview_service import PageviewService
from services.timestamp_service import TimestampService
from services.language_service import LanguageService
from services.species_service import SpeciesService


class TestPageviewService(unittest.TestCase):

    def test_add_and_get_top_species(self):
        """Test that service correctly transforms species data."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        # Add pageviews (service calls dao.create)
        service.add_pageview(
            timestamp_ID=1, language_ID=1, species_ID=1, number_of_pageviews=100
        )
        service.add_pageview(
            timestamp_ID=1, language_ID=1, species_ID=1, number_of_pageviews=50
        )
        service.add_pageview(
            timestamp_ID=1, language_ID=1, species_ID=2, number_of_pageviews=75
        )

        # Mock what the DAO returns
        mock_dao.get_top_species_by_language.return_value = [
            (1, "Panthera leo", 150),
            (2, "Canis lupus", 75),
        ]

        result = service.get_top_species_for_language("en", limit=2)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], 1)
        self.assertEqual(result[0]["latin_name"], "Panthera leo")
        self.assertEqual(result[0]["pageviews"], 150)
        self.assertEqual(result[1]["pageviews"], 75)

    def test_get_languages_map_data(self):
        """Test language to country mapping."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        # Mock the DAO response
        mock_dao.get_total_pageviews_by_language.return_value = [
            ("en", 300),
            ("fi", 50),
        ]

        result = service.get_languages_map_data()

        self.assertEqual(result["USA"], 300)  # en maps to USA
        self.assertEqual(result["FIN"], 50)  # fi maps to FIN
        mock_dao.get_total_pageviews_by_language.assert_called_once_with(None)


class TestTimestampService(unittest.TestCase):

    def test_get_available_months(self):
        """Test retrieving available months."""
        mock_dao = Mock()
        service = TimestampService(mock_dao)

        # Add timestamps
        service.add_timestamp(datetime.datetime(2025, 12, 1))
        service.add_timestamp(datetime.datetime(2026, 1, 15))

        # Mock the DAO response
        mock_dao.get_available_months.return_value = ["2025-12", "2026-01"]

        result = service.get_available_months()

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0], "2025-12")
        self.assertEqual(result[1], "2026-01")


class TestLanguageService(unittest.TestCase):

    def test_add_language(self):
        """Test adding a language."""
        mock_dao = Mock()
        service = LanguageService(mock_dao)

        service.add_language(name="English", iso_639_3="eng", language_range="stan1293")

        mock_dao.create.assert_called_once_with("English", "eng", "stan1293")


class TestSpeciesService(unittest.TestCase):

    def test_add_species(self):
        """Test adding a species."""
        mock_dao = Mock()
        service = SpeciesService(mock_dao)

        service.add_species(latin_name="Panthera leo", species_type="mammal")

        mock_dao.create.assert_called_once_with("Panthera leo", "mammal")
