## Commands
Create .env file with the following variables:
```
DB_PATH
MIGRATIONS_DIR
```
Create venv:
```
python3 -m venv venv
source venv/bin/activate
```
Run the requirements in the venv:
```
pip install -r ./requirements.txt
```
Intitialize database with migrations:
```
in project root:  python3 db/migrate.py
```

