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

## Setup

### 1. Create and activate the Python environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3. Run database migrations

```bash
python3 db/migrate.py
```

### 4. Prepare the data files

Download [iso-639-3-macrolanguages.tab](https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3-macrolanguages.tab) and place it in `data_wrangling/`.

Make sure the pageview pickle files are available in `data_wrangling/` as well:

- `pageview_mammal_monthly.pkl`
- `pageview_bird_monthly.pkl`
- `pageview_reptile_monthly.pkl`

Then run the wrangling step:

```bash
cd data_wrangling
python3 datawrangle.py
```

Adjust `PAGEVIEW_BATCH_SIZE` if you need a different batch size.

### 5. Populate the database

From the project root:

```bash
python3 src/populate_db.py
```

### 6. Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the Application

Start the backend from the project root:

```bash
python3 src/api.py
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

Backend defaults to port `5000`; the frontend uses Vite's default dev port.

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
