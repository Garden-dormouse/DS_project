#!/bin/bash

set -e

# Create and activate virtual environment
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Check .env file
if [ -z "$DB_URL" ]; then
  echo "Error: DB_URL not set in .env file"
  exit 1
fi

# Initialize database
python3 db/migrate.py

# Populate database if data files exist
if [ -f "data_wrangling/pageview_mammal_monthly.pkl" ]; then
  cd data_wrangling
  python3 datawrangle.py
  cd ..
  python3 src/populate_db.py
fi

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start servers
echo "Starting backend and frontend..."
python3 src/api.py &
BACKEND_PID=$!

cd frontend
npm run dev
cd ..

trap "kill $BACKEND_PID" EXIT