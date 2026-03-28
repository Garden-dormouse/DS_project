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
        """Test /api/species endpoint returns list."""
        with patch("api.SessionFactory") as mock_session_factory:
            mock_session = Mock()
            mock_session_factory.return_value.__enter__.return_value = mock_session

            with patch("api.SQLAlchemySpeciesDAO") as mock_dao:
                mock_species = Mock()
                mock_species.ID = 1
                mock_species.latin_name = "Panthera leo"
                mock_dao.return_value.get_all.return_value = [mock_species]

                response = self.client.get("/api/species")

                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertEqual(len(data), 1)
                self.assertEqual(data[0]["latin_name"], "Panthera leo")

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
