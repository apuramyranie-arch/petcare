# PawCare
Local classroom demonstration using Flask, HTML/CSS/JS and Firebase Firestore. Python 3.10+ recommended.

## Setup in PyCharm (Windows PowerShell)
Open the PawCare folder. Select a Python interpreter or create a virtual environment. Run `python -m pip install -r requirements.txt`. Create a Firebase project and a Cloud Firestore database. In Project Settings > Service accounts, generate a private key and save it as ServiceAccountKey.json in this folder. Run `Copy-Item .env.example .env`. Publish the supplied firestore.rules in Firestore Rules (blocks direct client access; Admin SDK uses IAM). Never commit the key or .env. Run `python seed.py` for optional fictional sample records, then `python app.py`. Open http://127.0.0.1:5000.

## Data model
owners: full_name, phone, email, address. pets: name, species, breed, age (integer years), sex, owner_id. appointments: owner_id, pet_id, date, time, service, status. All have document IDs and creation timestamps. IDs link documents. Register owners before pets, then appointments. Delete dependent records first. This is a local single-user demo, not an authenticated production service; do not expose it publicly or use real personal data.

## CRUD test
Add an owner, search for it, view it, edit it, add a linked pet and appointment. Verify documents in Firestore console. Try invalid email, mismatched pet/owner, and deleting a linked owner (must fail). Delete appointment, pet, then owner. GET /api/pets?q=Luna demonstrates backend filtering. GET/PUT/DELETE /api/pets/<id> target a single record. POST /api/pets creates one. Repeat for owners and appointments.

## Submission
Create a private GitHub repository, verify git status does not include credentials, push source and README, invite kidlat14 as collaborator. Submit link by December 6, 2026 for full timeliness credit (December 7 deadline).
