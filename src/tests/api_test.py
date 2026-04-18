import unittest
from unittest.mock import patch, Mock
import os, sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from api import app


class TestAPIEndpoints(unittest.TestCase):

    def setUp(self):
        """Set up test client for each test."""
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_get_species_returns_json(self):
        """Test /api/species endpoint returns paginated search payload."""
        with patch("api.SessionFactory") as mock_session_factory:
            mock_session = Mock()
            mock_session_factory.return_value.__enter__.return_value = mock_session

            with patch("api.SpeciesService") as mock_service:
                mock_service.return_value.search_species.return_value = {
                    "items": [
                        {"id": 1, "latin_name": "Panthera leo", "type": "mammal"}
                    ],
                    "limit": 25,
                    "offset": 0,
                    "has_more": True,
                    "next_offset": 25,
                }

                response = self.client.get("/api/species?limit=25&q=panthera")

                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertEqual(len(data["items"]), 1)
                self.assertEqual(data["items"][0]["id"], 1)
                self.assertEqual(data["items"][0]["latin_name"], "Panthera leo")
                mock_service.return_value.search_species.assert_called_once_with(
                    query="panthera",
                    species_type=None,
                    limit=25,
                    offset=0,
                )

    def test_get_species_types(self):
        """Test /api/species/types endpoint returns available species types."""
        response = self.client.get("/api/species/types")

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data, ["mammal", "bird", "reptile"])

    def test_top_species_requires_language_code(self):
        """Test /api/pageviews/top-species without query param returns empty."""
        response = self.client.get("/api/pageviews/top-species")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

    @patch("api.PageviewService")
    @patch("api.SQLAlchemyPageviewDAO")
    @patch("api.SessionFactory")
    def test_top_species_returns_results(
        self, mock_session_factory, mock_pageview_dao, mock_service
    ):
        """Test /api/pageviews/top-species with language code."""
        mock_session = Mock()
        mock_session_factory.return_value.__enter__.return_value = mock_session

        mock_service.return_value.get_top_species_for_language.return_value = [
            {"id": 1, "latin_name": "Panthera leo", "pageviews": 100}
        ]

        response = self.client.get(
            "/api/pageviews/top-species?language_code=eng&limit=1"
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["latin_name"], "Panthera leo")

    def test_language_range_known_code(self):
        """Test /api/languages/<iso_code>/range returns GeoJSON for known language."""
        response = self.client.get("/api/languages/eng/range")

        self.assertEqual(response.status_code, 200)
        range_data = response.get_json()
        self.assertIn("type", range_data)
        self.assertEqual(range_data["type"], "FeatureCollection")
        self.assertIn("features", range_data)

    def test_language_range_unknown_code(self):
        """Test /api/languages/<iso_code>/range returns empty GeoJSON for unknown language."""
        response = self.client.get("/api/languages/unknown123/range")

        self.assertEqual(response.status_code, 200)
        range_data = response.get_json()
        self.assertEqual(range_data["type"], "FeatureCollection")
        self.assertEqual(range_data["features"], [])

    @patch("api.SessionFactory")
    @patch("api.SQLAlchemyLanguageDAO")
    def test_get_languages(self, mock_language_dao, mock_session_factory):
        """Test /api/languages endpoint returns list of languages."""
        mock_session = Mock()
        mock_session_factory.return_value.__enter__.return_value = mock_session

        mock_lang1 = Mock()
        mock_lang1.iso_639_3 = "eng"
        mock_lang1.name = "English"

        mock_lang2 = Mock()
        mock_lang2.iso_639_3 = "fin"
        mock_lang2.name = "Finnish"

        mock_language_dao.return_value.get_all.return_value = [mock_lang1, mock_lang2]

        response = self.client.get("/api/languages")

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)
        self.assertIn("eng", {item["code"] for item in data})
        self.assertIn("fin", {item["code"] for item in data})

    @patch("api.SessionFactory")
    @patch("api.SQLAlchemyTimestampDAO")
    def test_get_available_months(self, mock_timestamp_dao, mock_session_factory):
        """Test /api/timestamps/months endpoint returns available months."""
        mock_session = Mock()
        mock_session_factory.return_value.__enter__.return_value = mock_session

        mock_timestamp_service = Mock()
        mock_timestamp_service.get_available_months.return_value = [
            "2025-12",
            "2026-01",
        ]

        with patch("api.TimestampService", return_value=mock_timestamp_service):
            response = self.client.get("/api/timestamps/months")

            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(len(data), 2)
            self.assertIn("2025-12", data)
            self.assertIn("2026-01", data)

    @patch("api.SessionFactory")
    @patch("api.SQLAlchemyPageviewDAO")
    def test_get_languages_map_data(self, mock_pageview_dao, mock_session_factory):
        """Test /api/languages/map-data returns language pageview counts."""
        mock_session = Mock()
        mock_session_factory.return_value.__enter__.return_value = mock_session

        mock_pageview_service = Mock()
        mock_pageview_service.get_languages_map_data.return_value = {
            "eng": 300,
            "fin": 50,
        }

        with patch("api.PageviewService", return_value=mock_pageview_service):
            response = self.client.get("/api/languages/map-data?start_month=2026-01&end_month=2026-01")

            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data["eng"], 300)
            self.assertEqual(data["fin"], 50)

    @patch("api.SessionFactory")
    @patch("api.SQLAlchemyPageviewDAO")
    def test_get_timeseries(self, mock_pageview_dao, mock_session_factory):
        """Test /api/pageviews/timeseries returns monthly pageview data."""
        mock_session = Mock()
        mock_session_factory.return_value.__enter__.return_value = mock_session

        mock_pageview_service = Mock()
        mock_pageview_service.get_timeseries.return_value = [
            {"month": "2025-12", "pageviews": 1000},
            {"month": "2026-01", "pageviews": 1200},
        ]

        with patch("api.PageviewService", return_value=mock_pageview_service):
            response = self.client.get(
                "/api/pageviews/timeseries?language_code=eng&start_month=2025-12&end_month=2026-01"
            )

            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(len(data), 2)
            self.assertEqual(data[0]["month"], "2025-12")
            self.assertEqual(data[1]["pageviews"], 1200)
