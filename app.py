import os
import re

from datetime import date, time
from pathlib import Path

from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from google.cloud import firestore

from firebase_config import get_db


# =====================================================
# PETCARE - PET CARE MANAGEMENT SYSTEM
# Python Flask + Firebase Cloud Firestore
# =====================================================


# =====================================================
# 1. FLASK CONFIGURATION
# =====================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)


# =====================================================
# 2. FIRESTORE COLLECTIONS AND FIELDS
# =====================================================

FIELDS = {

    "owners": [
        "full_name",
        "phone",
        "email",
        "address"
    ],

    "pets": [
        "name",
        "species",
        "breed",
        "age",
        "sex",
        "owner_id"
    ],

    "appointments": [
        "pet_id",
        "owner_id",
        "date",
        "time",
        "service",
        "status"
    ]
}


ALLOWED_SPECIES = [
    "Dog",
    "Cat",
    "Bird",
    "Rabbit",
    "Other"
]


ALLOWED_SEX = [
    "Male",
    "Female"
]


ALLOWED_STATUS = [
    "Scheduled",
    "Completed",
    "Cancelled"
]


# =====================================================
# 3. HELPER FUNCTIONS
# =====================================================

def error(message, status=400):

    return jsonify({
        "success": False,
        "message": message
    }), status


def serialize(doc):

    data = doc.to_dict() or {}

    data["id"] = doc.id

    return data


def has_linked_records(db, collection, field, value):

    query = (
        db.collection(collection)
        .where(
            filter=firestore.FieldFilter(
                field,
                "==",
                value
            )
        )
        .limit(1)
    )

    return next(query.stream(), None) is not None


# =====================================================
# 4. SERVER-SIDE VALIDATION
# =====================================================

def validate(kind, data, db):

    if not isinstance(data, dict):

        raise ValueError("JSON object required.")

    result = {}

    for field in FIELDS[kind]:

        value = data.get(field)

        # AGE VALIDATION

        if field == "age":

            if (
                isinstance(value, bool)
                or not isinstance(value, int)
                or not 0 <= value <= 100
            ):

                raise ValueError(
                    "Age must be an integer from 0 to 100."
                )

        else:

            if (
                not isinstance(value, str)
                or not value.strip()
                or len(value) > 300
            ):

                raise ValueError(
                    f"Invalid or missing "
                    f"{field.replace('_', ' ')}."
                )

            value = value.strip()

        result[field] = value


    # =================================================
    # OWNER VALIDATION
    # =================================================

    if kind == "owners":

        if not re.fullmatch(
            r"[^\s@]+@[^\s@]+\.[^\s@]+",
            result["email"]
        ):

            raise ValueError(
                "Please enter a valid email address."
            )

        if not re.fullmatch(
            r"[+0-9 ()-]{7,20}",
            result["phone"]
        ):

            raise ValueError(
                "Please enter a valid phone number."
            )

        digits = re.sub(
            r"\D",
            "",
            result["phone"]
        )

        if not 7 <= len(digits) <= 15:

            raise ValueError(
                "Invalid phone number length."
            )


    # =================================================
    # PET VALIDATION
    # =================================================

    if kind == "pets":

        if result["species"] not in ALLOWED_SPECIES:

            raise ValueError("Invalid pet species.")

        if result["sex"] not in ALLOWED_SEX:

            raise ValueError("Invalid pet sex.")


    # =================================================
    # CHECK OWNER RELATIONSHIP
    # =================================================

    if kind in ["pets", "appointments"]:

        owner_id = result["owner_id"]

        if "/" in owner_id or owner_id in [".", ".."]:

            raise ValueError("Invalid owner ID.")

        owner = (
            db.collection("owners")
            .document(owner_id)
            .get()
        )

        if not owner.exists:

            raise ValueError(
                "Selected owner does not exist."
            )


    # =================================================
    # APPOINTMENT VALIDATION
    # =================================================

    if kind == "appointments":

        pet_id = result["pet_id"]

        if "/" in pet_id or pet_id in [".", ".."]:

            raise ValueError("Invalid pet ID.")

        pet = (
            db.collection("pets")
            .document(pet_id)
            .get()
        )

        if not pet.exists:

            raise ValueError(
                "Selected pet does not exist."
            )

        pet_data = pet.to_dict() or {}

        if pet_data.get("owner_id") != result["owner_id"]:

            raise ValueError(
                "Please select a pet belonging "
                "to the selected owner."
            )


        # DATE VALIDATION

        try:

            date.fromisoformat(result["date"])

        except ValueError:

            raise ValueError(
                "Please enter a valid appointment date."
            )


        # TIME VALIDATION

        try:

            time.fromisoformat(result["time"])

        except ValueError:

            raise ValueError(
                "Please enter a valid appointment time."
            )


        # STATUS VALIDATION

        if result["status"] not in ALLOWED_STATUS:

            raise ValueError(
                "Invalid appointment status."
            )

    return result


# =====================================================
# 5. MAIN PAGE
# =====================================================

@app.get("/")
def home():

    return render_template("index.html")


# =====================================================
# 6. FIREBASE CONNECTION TEST
# =====================================================

@app.get("/api/health")
def health():

    try:

        db = get_db()

        collections = [
            collection.id
            for collection in db.collections()
        ]

        return jsonify({

            "success": True,

            "message": (
                "PetCare is connected to Firebase Firestore."
            ),

            "collections": collections

        })

    except Exception:

        app.logger.exception(
            "Firebase connection failed."
        )

        return error(
            "Unable to connect to Firebase Firestore.",
            500
        )


# =====================================================
# 7. DASHBOARD SUMMARY
# =====================================================

@app.get("/api/summary")
def summary():

    try:

        db = get_db()

        owners = list(
            db.collection("owners").stream()
        )

        pets = list(
            db.collection("pets").stream()
        )

        appointments = list(
            db.collection("appointments").stream()
        )

        appointment_data = [
            serialize(doc)
            for doc in appointments
        ]


        # COUNT SCHEDULED APPOINTMENTS

        scheduled = sum(

            1 for item in appointment_data

            if item.get("status") == "Scheduled"

        )


        # COUNT COMPLETED APPOINTMENTS

        completed = sum(

            1 for item in appointment_data

            if item.get("status") == "Completed"

        )


        # COUNT CANCELLED APPOINTMENTS

        cancelled = sum(

            1 for item in appointment_data

            if item.get("status") == "Cancelled"

        )


        return jsonify({

            "success": True,

            "data": {

                "owners": len(owners),

                "pets": len(pets),

                "appointments": len(appointments),

                "scheduled": scheduled,

                "completed": completed,

                "cancelled": cancelled

            }

        })

    except Exception:

        app.logger.exception(
            "Dashboard summary failed."
        )

        return error(
            "Unable to load dashboard summary.",
            500
        )


# =====================================================
# 8. CREATE AND READ OPERATIONS
# =====================================================

@app.route(
    "/api/<kind>",
    methods=["GET", "POST"]
)
def collection(kind):

    if kind not in FIELDS:

        return error("Unknown collection.", 404)

    try:

        db = get_db()

        col = db.collection(kind)


        # =============================================
        # READ ALL RECORDS
        # =============================================

        if request.method == "GET":

            query = request.args.get(
                "q", ""
            ).strip().lower()

            rows = [

                serialize(doc)

                for doc in col.stream()

            ]


            # SEARCH RECORDS

            if query:

                rows = [

                    row for row in rows

                    if any(

                        query in str(
                            row.get(field, "")
                        ).lower()

                        for field in FIELDS[kind]

                    )

                ]


            # FILTER BY APPOINTMENT STATUS

            status = request.args.get(
                "status", ""
            ).strip()

            if kind == "appointments" and status:

                rows = [

                    row for row in rows

                    if row.get("status") == status

                ]


            # FILTER BY PET SPECIES

            species = request.args.get(
                "species", ""
            ).strip()

            if kind == "pets" and species:

                rows = [

                    row for row in rows

                    if row.get("species") == species

                ]


            return jsonify({

                "success": True,

                "data": rows,

                "total": len(rows)

            })


        # =============================================
        # CREATE NEW RECORD
        # =============================================

        data = validate(

            kind,

            request.get_json(silent=True),

            db

        )

        ref = col.document()

        ref.set({

            **data,

            "created_at": firestore.SERVER_TIMESTAMP,

            "updated_at": firestore.SERVER_TIMESTAMP

        })


        return jsonify({

            "success": True,

            "message": "Record added successfully.",

            "data": serialize(ref.get())

        }), 201


    except ValueError as e:

        return error(str(e), 400)


    except Exception:

        app.logger.exception(
            "Database operation failed."
        )

        return error(

            "Database operation failed. "
            "Check your Firebase configuration.",

            500

        )


# =====================================================
# 9. READ SINGLE, UPDATE AND DELETE OPERATIONS
# =====================================================

@app.route(
    "/api/<kind>/<id>",
    methods=["GET", "PUT", "DELETE"]
)
def record(kind, id):

    if kind not in FIELDS:

        return error("Unknown collection.", 404)


    if id in [".", ".."]:

        return error("Invalid record ID.", 400)


    try:

        db = get_db()

        ref = (

            db.collection(kind)

            .document(id)

        )

        doc = ref.get()


        # CHECK IF RECORD EXISTS

        if not doc.exists:

            return error(

                "Record not found.",

                404

            )


        # =============================================
        # READ SINGLE RECORD
        # =============================================

        if request.method == "GET":

            return jsonify({

                "success": True,

                "data": serialize(doc)

            })


        # =============================================
        # UPDATE RECORD
        # =============================================

        if request.method == "PUT":

            data = validate(

                kind,

                request.get_json(silent=True),

                db

            )

            old_data = doc.to_dict() or {}


            # PROTECT PET OWNER RELATIONSHIPS

            if kind == "pets":

                old_owner = old_data.get("owner_id")

                new_owner = data["owner_id"]

                if old_owner != new_owner:

                    if has_linked_records(

                        db,

                        "appointments",

                        "pet_id",

                        id

                    ):

                        return error(

                            "Remove linked appointments "
                            "before changing the pet owner.",

                            409

                        )


            # UPDATE FIRESTORE DOCUMENT

            ref.update({

                **data,

                "updated_at":
                    firestore.SERVER_TIMESTAMP

            })


            return jsonify({

                "success": True,

                "message": "Record updated successfully.",

                "data": serialize(ref.get())

            })


        # =============================================
        # DELETE RECORD
        # =============================================

        links = {

            "owners": [

                ("pets", "owner_id"),

                ("appointments", "owner_id")

            ],

            "pets": [

                ("appointments", "pet_id")

            ]

        }


        # CHECK LINKED RECORDS BEFORE DELETING

        for target, field in links.get(kind, []):

            if has_linked_records(

                db,

                target,

                field,

                id

            ):

                return error(

                    f"Cannot delete this record because "
                    f"it has linked {target}. "
                    f"Remove the linked records first.",

                    409

                )


        # DELETE FROM FIRESTORE

        ref.delete()


        return jsonify({

            "success": True,

            "message": "Record deleted successfully."

        })


    except ValueError as e:

        return error(str(e), 400)


    except Exception:

        app.logger.exception(
            "Database operation failed."
        )

        return error(

            "Database operation failed.",

            500

        )


# =====================================================
# 10. RUN FLASK APPLICATION
# =====================================================

if __name__ == "__main__":

    print("=" * 55)

    print("PETCARE - PET CARE MANAGEMENT SYSTEM")

    print("Python Flask + Firebase Cloud Firestore")

    print("=" * 55)


    try:

        # INITIALIZE FIREBASE CONNECTION

        db = get_db()

        collections = list(db.collections())

        print(
            "[SUCCESS] Firebase Firestore connected."
        )


        # DISPLAY AVAILABLE COLLECTIONS

        print("\nAvailable collections:")

        if collections:

            for collection_item in collections:

                print(f" - {collection_item.id}")

        else:

            print("No collections found yet.")

            print("Run py seed.py to add sample records.")


        # SERVER CONFIGURATION

        port = int(

            os.getenv("PORT", "5000")

        )

        debug = (

            os.getenv(
                "FLASK_DEBUG",
                "false"
            ).lower() == "true"

        )


        print("\nPetCare is ready!")

        print(f"Website: http://127.0.0.1:{port}")

        print(f"Firebase Test: http://127.0.0.1:{port}/api/health")

        print("=" * 55)


        # START FLASK SERVER

        app.run(

            host="127.0.0.1",

            port=port,

            debug=debug,

            use_reloader=False

        )


    except Exception as e:

        print(f"\n[ERROR] {e}")

        print(

            "Please check your .env file "
            "and Firebase service account JSON."

        )

        raise