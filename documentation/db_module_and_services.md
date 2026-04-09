# db_module & Services Documentation

This document explains the purpose of each module in `src/db_module/` and `src/services/`, how they relate to each other, and how to extend them when adding new functionality.

---

## Architecture Overview

The backend follows a layered architecture:

```
API (api.py)  →  Services (services/)  →  DAOs (db_module/dao/)  →  Database
```

- **API layer** (`api.py`): Flask routes. Reads query params, creates a DB session, instantiates DAOs and services, returns JSON.
- **Service layer** (`services/`): Business logic. Transforms raw DAO results into API-friendly dicts/lists. Depends on abstract DAO interfaces, not concrete implementations.
- **DAO layer** (`db_module/dao/`): Data access objects. Runs SQLAlchemy queries and returns ORM objects or raw tuples. Each DAO has an abstract interface and a SQLAlchemy implementation.
- **Models** (`db_module/models.py`): SQLAlchemy ORM classes mapping to database tables.
- **Engine** (`db_module/engine.py`): Creates the SQLAlchemy engine and session factory from a database URL.
- **Base** (`db_module/base.py`): Shared `DeclarativeBase` that all ORM models inherit from.

---

## db_module

### `base.py`

Defines `Base`, the shared SQLAlchemy `DeclarativeBase`. All ORM models must inherit from this class so they share the same metadata registry.

### `engine.py`

Provides two helper functions:

| Function | Purpose |
|---|---|
| `get_engine(db_url)` | Creates a SQLAlchemy `Engine` from a database URL string |
| `get_session_factory(engine)` | Creates a `sessionmaker` bound to the engine |

Usage in `api.py`:

```python
engine = get_engine(DB_URL)
SessionFactory = get_session_factory(engine)
```

### `models.py`

ORM classes mapped to database tables:

| Model | Table | Columns |
|---|---|---|
| `Species` | `species` | `id`, `latin_name`, `type` |
| `Language` | `languages` | `id`, `name`, `iso_639_3`, `language_range` |
| `Timestamp` | `timestamps` | `id`, `time` |
| `Pageview` | `pageviews` | `id`, `timestamp_id`, `language_id`, `species_id`, `number_of_pageviews` |

`Pageview` has foreign keys to `Species`, `Language`, and `Timestamp`, with bidirectional relationships defined via `relationship()`.

### `dao/abstract.py`

Abstract base classes (ABCs) that define the interface for each DAO. The service layer depends only on these abstractions, not on the SQLAlchemy implementations.

Abstract DAOs defined:

| ABC | Key Methods |
|---|---|
| `SpeciesDAO` | `get_by_id`, `get_all`, `create_single`, `create_many` |
| `LanguageDAO` | `get_by_id`, `get_all`, `get_by_name`, `get_by_iso`, `create` |
| `TimestampDAO` | `get_by_id`, `get_all`, `get_available_months`, `create` |
| `PageviewDAO` | `get_by_id`, `get_all`, `get_top_species_by_language`, `get_total_pageviews_by_language`, `create_single`, `create_many` |

### `dao/species_dao.py`

`SQLAlchemySpeciesDAO`: Concrete implementation of `SpeciesDAO`. Implements CRUD operations for species records.

### `dao/language_dao.py`

`SQLAlchemyLanguageDAO`: Concrete implementation of `LanguageDAO`. Provides lookup by ID, name, and ISO 639-3 code.

### `dao/timestamp_dao.py`

`SQLAlchemyTimestampDAO`: Concrete implementation of `TimestampDAO`. Provides lookup for available timestamps.

### `dao/pageview_dao.py`

`SQLAlchemyPageviewDAO`: Concrete implementation of `PageviewDAO`. The most complex DAO, containing multi-table join queries with optional filters.

---

## Services

Each service class takes its corresponding abstract DAO in the constructor via dependency injection. This makes services testable with mock DAOs.

### `language_service.py` - `LanguageService`

| Method | Purpose |
|---|---|
| `get_range_by_name(name)` | Returns parsed GeoJSON dict for a language's geographic range (by name) |
| `get_range_by_iso(iso_639_3)` | Returns parsed GeoJSON dict for a language's geographic range (by ISO code) |
| `add_language(name, iso_639_3, language_range)` | Creates a new language record |

### `pageview_service.py` - `PageviewService`

The most feature-rich service. Transforms raw DAO tuples into API-ready dicts.

| Method | Returns | Purpose |
|---|---|---|
| `get_top_species_for_language(...)` | `list[dict]` | Top species ranked by pageviews for a language. Each dict: `{id, latin_name, type, pageviews}` |
| `get_top_languages_for_species(...)` | `list[dict]` | Top languages ranked by pageviews for a species. Each dict: `{code, name, pageviews}` |
| `get_timeseries(...)` | `list[dict]` | Monthly pageview totals. Each dict: `{month, pageviews}` |
| `get_languages_map_data(...)` | `dict[str, int]` | Language code → total pageviews mapping for map visualization |
| `add_pageview(...)` | `Pageview` | Creates a single pageview record |
| `add_many_pageviews(...)` | `list[Pageview]` | Batch-creates pageview records |

### `species_service.py` - `SpeciesService`

| Method | Purpose |
|---|---|
| `add_species(latin_name, species_type)` | Creates a single species record |
| `add_many_species(species_list)` | Batch-creates species records |

### `timestamp_service.py` - `TimestampService`

| Method | Purpose |
|---|---|
| `get_available_months()` | Returns list of distinct `YYYY-MM` strings available in the database |
| `add_timestamp(time)` | Creates a new timestamp record |

---

## How to Add a New Method

Follow these steps when you need to add new database access or business logic.

### 1. Add the abstract method to the DAO interface

In `db_module/dao/abstract.py`, add an `@abstractmethod` to the relevant ABC with a docstring specifying args and return type:

```python
# In the relevant abstract DAO class
@abstractmethod
def get_by_type(self, species_type: str) -> list[Species]:
    """
    Retrieve all species of a given type.

    Args:
        species_type (str): The type to filter by (e.g., 'mammal').

    Returns:
        list[Species]: Matching species.
    """
    pass
```

### 2. Implement the method in the concrete DAO

In the corresponding `dao/*_dao.py` file, implement the method using SQLAlchemy queries:

```python
# In SQLAlchemySpeciesDAO
def get_by_type(self, species_type: str) -> list[Species]:
    return self.session.query(Species).filter(Species.type == species_type).all()
```

The concrete DAO always receives a `Session` in its constructor — use `self.session` to build queries.

### 3. Add the service method

In the corresponding `services/*_service.py` file, add a method that calls the DAO and transforms the result into an API-friendly format (dicts/lists):

```python
# In SpeciesService
def get_species_by_type(self, species_type: str):
    species = self.species_dao.get_by_type(species_type)
    return [
        {"id": s.id, "latin_name": s.latin_name, "type": s.type}
        for s in species
    ]
```

Services should transform raw ORM objects/tuples into plain dicts. Keep business logic here, not in the DAO or API layer.

### 4. Add the API route

In `api.py`, add a new Flask route. Follow the existing pattern — open a session, create the DAO, create the service, call the service method, return JSON:

```python
@app.route("/api/species/by-type", methods=["GET"])
def get_species_by_type():
    species_type = request.args.get("species_type")
    if not species_type:
        return jsonify([])

    with SessionFactory() as session:
        species_dao = SQLAlchemySpeciesDAO(session)
        service = SpeciesService(species_dao)
        result = service.get_species_by_type(species_type)

    return jsonify(result)
```

### 5. Add tests

Tests live in `src/tests/`. The project uses `unittest` with `unittest.mock.Mock` for DAO mocking.

**Service test** (in `services_test.py`) — mock the DAO, call the service, assert the output:

```python
def test_get_species_by_type(self):
    mock_dao = Mock()
    service = SpeciesService(mock_dao)

    mock_dao.get_by_type.return_value = [
        Mock(id=1, latin_name="Panthera leo", type="mammal"),
    ]

    result = service.get_species_by_type("mammal")

    self.assertEqual(len(result), 1)
    self.assertEqual(result[0]["latin_name"], "Panthera leo")
    mock_dao.get_by_type.assert_called_once_with("mammal")
```

**API test** (in `api_test.py`) — use `@patch` to mock the session factory and DAO/service, then test the HTTP response:

```python
@patch("api.SessionFactory")
@patch("api.SQLAlchemySpeciesDAO")
def test_get_species_by_type(self, mock_dao, mock_session_factory):
    mock_session = Mock()
    mock_session_factory.return_value.__enter__.return_value = mock_session

    mock_service = Mock()
    mock_service.get_species_by_type.return_value = [
        {"id": 1, "latin_name": "Panthera leo", "type": "mammal"}
    ]

    with patch("api.SpeciesService", return_value=mock_service):
        response = self.client.get("/api/species/by-type?species_type=mammal")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 1)
```

Run tests with:

```bash
pytest src/tests/ -v
```

---

## How to Add a New Entity

If you need to add an entirely new database table and its associated modules:

1. **Add a migration** in `db/migrations/` (e.g., `003_add_new_table.sql`) with the `CREATE TABLE` statement.
2. **Add the ORM model** in `db_module/models.py` inheriting from `Base`. Define columns and any relationships.
3. **Add the abstract DAO** in `db_module/dao/abstract.py` as a new ABC class.
4. **Add the concrete DAO** as a new file in `db_module/dao/` (e.g., `new_entity_dao.py`) implementing the abstract interface.
5. **Add the service** as a new file in `src/services/` (e.g., `new_entity_service.py`).
6. **Add API routes** in `api.py`, importing the new DAO and service.
7. **Add tests** in `src/tests/` for both the service and API layers.

---

## Key Patterns & Conventions

- **Dependency injection**: Services receive abstract DAOs, not concrete ones. The API layer wires everything together.
- **Session management**: Sessions are created per-request in `api.py` using `with SessionFactory() as session:`. DAOs receive the session in their constructor.
- **Data transformation**: DAOs return ORM objects or raw tuples. Services transform these into plain dicts for JSON serialization.
- **Date filtering**: Month strings use `YYYY-MM` format. The `_month_range()` helper in `pageview_dao.py` converts these to date ranges.
- **Testing**: Services are tested with mocked DAOs. API endpoints are tested with Flask's test client and patched dependencies.
