import os
import json
from pathlib import Path
from threading import Lock

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv


# ==========================================
# PROJECT CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

_db = None
_lock = Lock()


# ==========================================
# FIREBASE CONNECTION
# ==========================================

def get_db():

    global _db

    with _lock:

        if _db is not None:
            return _db

        try:

            try:
                firebase_app = firebase_admin.get_app()

            except ValueError:

                # ==================================
                # VERCEL FIREBASE CONFIGURATION
                # ==================================

                firebase_json = os.getenv(
                    "FIREBASE_SERVICE_ACCOUNT"
                )

                if firebase_json:

                    service_account = json.loads(
                        firebase_json
                    )

                    cred = credentials.Certificate(
                        service_account
                    )

                    print("[INFO] Using Vercel credentials.")

                # ==================================
                # LOCAL PYCHARM CONFIGURATION
                # ==================================

                else:

                    credential_path = os.getenv(
                        "GOOGLE_APPLICATION_CREDENTIALS",
                        "ServiceAccountKey.json"
                    )

                    credential_path = Path(
                        credential_path
                    )

                    if not credential_path.is_absolute():

                        credential_path = (
                            BASE_DIR / credential_path
                        )

                    if not credential_path.is_file():

                        raise FileNotFoundError(
                            f"Firebase JSON file not found: "
                            f"{credential_path}"
                        )

                    cred = credentials.Certificate(
                        str(credential_path)
                    )

                    print("[INFO] Using local credentials.")

                firebase_app = firebase_admin.initialize_app(
                    cred
                )

            # Connect to Firestore

            _db = firestore.client(app=firebase_app)

            print("[SUCCESS] PetCare Firebase initialized.")

            return _db

        except Exception as error:

            print(f"[ERROR] Firebase connection: {error}")

            raise


# ==========================================
# TEST FIRESTORE CONNECTION
# ==========================================

if __name__ == "__main__":

    try:

        db = get_db()

        collections = list(db.collections())

        print("[SUCCESS] Firestore connected successfully!")

        print("\nAvailable collections:")

        if collections:

            for collection in collections:

                print(f" - {collection.id}")

        else:

            print("No collections found.")

    except Exception as error:

        print(f"[FAILED] {error}")
