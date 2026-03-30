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
            timestamp_id=1, language_id=1, species_id=1, number_of_pageviews=100
        )
        service.add_pageview(
            timestamp_id=1, language_id=1, species_id=1, number_of_pageviews=50
        )
        service.add_pageview(
            timestamp_id=1, language_id=1, species_id=2, number_of_pageviews=75
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

    def test_add_single_pageview(self):
        """Test adding a single pageview."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        service.add_pageview(
            timestamp_id=1, language_id=2, species_id=3, number_of_pageviews=42
        )

        mock_dao.create_single.assert_called_once_with(
            timestamp_id=1, language_id=2, species_id=3, number_of_pageviews=42
        )

    def test_get_top_species_with_date_range(self):
        """Test getting top species with date range filters."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        mock_dao.get_top_species_by_language.return_value = [
            (1, "Panthera leo", 500),
        ]

        result = service.get_top_species_for_language(
            language_code="eng",
            limit=10,
            start_month="2025-12",
            end_month="2026-01",
            species_type="mammal",
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["latin_name"], "Panthera leo")
        mock_dao.get_top_species_by_language.assert_called_once_with(
            language_code="eng",
            limit=10,
            start_month="2025-12",
            end_month="2026-01",
            species_type="mammal",
        )

    def test_get_languages_map_data(self):
        """Test language map data returns language codes with pageviews."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        # Mock the DAO response
        mock_dao.get_total_pageviews_by_language.return_value = [
            ("eng", 300),
            ("fin", 50),
        ]

        result = service.get_languages_map_data()

        self.assertEqual(result["eng"], 300)  # Language code with pageviews
        self.assertEqual(result["fin"], 50)  # Language code with pageviews
        mock_dao.get_total_pageviews_by_language.assert_called_once_with(
            month=None, species_type=None
        )

    def test_get_languages_map_data_with_filters(self):
        """Test language map data with month and species type filters."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        mock_dao.get_total_pageviews_by_language.return_value = [("eng", 150)]

        result = service.get_languages_map_data(month="2026-01", species_type="mammal")

        self.assertEqual(result["eng"], 150)
        mock_dao.get_total_pageviews_by_language.assert_called_once_with(
            month="2026-01", species_type="mammal"
        )

    def test_get_timeseries(self):
        """Test timeseries data transformation."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        mock_dao.get_timeseries_by_language.return_value = [
            ("2025-12", 1000),
            ("2026-01", 1200),
        ]

        result = service.get_timeseries(language_code="eng")

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["month"], "2025-12")
        self.assertEqual(result[0]["pageviews"], 1000)
        self.assertEqual(result[1]["month"], "2026-01")

    def test_add_pageviews_batch(self):
        """Test adding multiple pageviews at once."""
        mock_dao = Mock()
        service = PageviewService(mock_dao)

        pageviews = [
            (1, 1, 1, 100),
            (1, 1, 2, 50),
            (2, 2, 1, 75),
        ]

        service.add_many_pageviews(pageviews)

        mock_dao.create_many.assert_called_once_with(pageviews)


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

    def test_add_timestamp(self):
        """Test adding a single timestamp."""
        mock_dao = Mock()
        service = TimestampService(mock_dao)

        test_date = datetime.date(2026, 1, 15)
        service.add_timestamp(test_date)

        mock_dao.create.assert_called_once_with(test_date)


class TestLanguageService(unittest.TestCase):

    def test_add_language(self):
        """Test adding a language."""
        mock_dao = Mock()
        service = LanguageService(mock_dao)

        service.add_language(name="English", iso_639_3="eng", language_range="stan1293")

        mock_dao.create.assert_called_once_with("English", "eng", "stan1293")

    def test_get_range_by_iso(self):
        """Test retrieving language range by ISO code."""
        mock_dao = Mock()
        service = LanguageService(mock_dao)

        mock_lang = Mock()
        mock_lang.language_range = '{"type": "FeatureCollection", "features": []}'
        mock_dao.get_by_iso.return_value = mock_lang

        result = service.get_range_by_iso("eng")

        self.assertEqual(result["type"], "FeatureCollection")
        mock_dao.get_by_iso.assert_called_once_with("eng")

    def test_get_range_by_iso_not_found(self):
        """Test retrieving language range returns empty dict if language not found."""
        mock_dao = Mock()
        service = LanguageService(mock_dao)
        mock_dao.get_by_iso.return_value = None

        result = service.get_range_by_iso("unknown")

        self.assertEqual(result, {})

    def test_get_range_by_name(self):
        """Test retrieving language range by language name."""
        mock_dao = Mock()
        service = LanguageService(mock_dao)

        mock_lang = Mock()
        mock_lang.language_range = '{"type": "FeatureCollection", "features": []}'
        mock_dao.get_by_name.return_value = mock_lang

        result = service.get_range_by_name("English")

        self.assertEqual(result["type"], "FeatureCollection")
        mock_dao.get_by_name.assert_called_once_with("English")


class TestSpeciesService(unittest.TestCase):

    def test_add_species(self):
        """Test adding a species."""
        mock_dao = Mock()
        service = SpeciesService(mock_dao)

        service.add_species(latin_name="Panthera leo", species_type="mammal")

        mock_dao.create_single.assert_called_once_with("Panthera leo", "mammal")

    def test_add_many_species(self):
        """Test adding multiple species at once."""
        mock_dao = Mock()
        service = SpeciesService(mock_dao)

        species_list = [
            ("Panthera leo", "mammal"),
            ("Aquila chrysaetos", "bird"),
            ("Crocodylus niloticus", "reptile"),
        ]

        service.add_many_species(species_list)

        mock_dao.create_many.assert_called_once_with(species_list)
