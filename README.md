# DS_project

Data science course project at the University of Helsinki.

This app combines a Flask backend, PostgreSQL database, and React/Vite frontend for exploring language and species pageview data.

## Project Overview

The project centers on three data sources:

- language metadata and geographic ranges
- species metadata and search
- monthly pageview aggregates for languages and species

The frontend uses React Query for cached data fetching, and the backend exposes a REST API for languages, species, monthly ranges, and pageview summaries.

## Features

- Interactive world map for language coverage
- Filters for language, species type, and month range
- Top species and top languages analysis views
- Monthly pageview time series charts

## Tech Stack

- Python 3, Flask, SQLAlchemy, pandas, NumPy
- PostgreSQL
- React, Vite, React Query, D3 Geo, topojson-client
- Pytest for backend tests

## Repository Structure

```text
data_wrangling/   Data wrangling scripts and source files
db/               Database migrations and migration runner
documentation/    Architecture notes and project instructions
frontend/         React frontend
src/              Flask API, database models, services, and tests
```

## Prerequisites

- Python 3 and `venv`
- Node.js and npm
- PostgreSQL database

## Environment Variables

Create a `.env` file in the project root with:

```env
DB_URL=
MIGRATIONS_DIR=
```

Set `VITE_API_URL` in `frontend/.env` if the backend is not on `http://localhost:5000`.

## Quick Start with Dev Script

For a faster setup, use the provided `dev.sh` script which automates the entire setup and starts both servers:

```bash
chmod +x dev.sh
./dev.sh
```

## Testing and Validation

Run the backend tests from the project root:

```bash
pytest -q
```

or:

```bash
pytest src/tests/ -v
```

For the frontend:

```bash
cd frontend
npm run build
npm run lint
```

## API Endpoints

The backend provides endpoints for:

- `/api/species`
- `/api/species/types`
- `/api/languages`
- `/api/languages/map-data`
- `/api/languages/<iso_code>/range`
- `/api/pageviews/top-species`
- `/api/pageviews/top-languages`
- `/api/pageviews/timeseries`
- `/api/timestamps/months`

## Documentation

- [Project instructions](documentation/instructions.md)
- [Database architecture](documentation/db_architecture.md)
- [Database module and services](documentation/db_module_and_services.md)
- [Sequence diagrams](documentation/sequence_diagrams.md)
- [Package diagram](documentation/package_diagram.md)
