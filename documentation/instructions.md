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
Download [iso-639-3-macrolanguages.tab](https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3-macrolanguages.tab) and place it inside the data_wrangling folder. Then navigate to data_wrangling folder and make sure the pageview_mammal_monthly.pkl file is inside:
```
python3 datawrangle.py
```
Next, go back to the root and populate the database:
```
python3 src/populate_db.py
```
Install the dependencies for the frontend:
```
inside frontend folder: npm install
```
Finally, to run the application, start the backend in one terminal:
```
in root: python3 src/api.py
```
And open the frontend in another terminal:
```
in frontend folder: npm run dev
```
