from firebase_config import get_db
from google.cloud import firestore


# =====================================================
# PETCARE - SAMPLE DATA
# =====================================================

db = get_db()


# =====================================================
# 1. SAMPLE PET OWNERS
# =====================================================

owners = [
    {
        "id": "sample-owner-1",
        "full_name": "Ana Santos",
        "phone": "09000000001",
        "email": "ana@example.com",
        "address": "Passi City, Iloilo"
    },
    {
        "id": "sample-owner-2",
        "full_name": "Marco Reyes",
        "phone": "09000000002",
        "email": "marco@example.com",
        "address": "San Enrique, Iloilo"
    },
    {
        "id": "sample-owner-3",
        "full_name": "Ella Cruz",
        "phone": "09000000003",
        "email": "ella@example.com",
        "address": "Dingle, Iloilo"
    },
    {
        "id": "sample-owner-4",
        "full_name": "Leo Garcia",
        "phone": "09000000004",
        "email": "leo@example.com",
        "address": "Dueñas, Iloilo"
    }
]


# =====================================================
# 2. SAMPLE PET PROFILES
# =====================================================

pets = [
    {
        "id": "sample-pet-1",
        "name": "Luna",
        "species": "Dog",
        "breed": "Shih Tzu",
        "age": 2,
        "sex": "Female",
        "owner_id": "sample-owner-1"
    },
    {
        "id": "sample-pet-2",
        "name": "Milo",
        "species": "Cat",
        "breed": "Persian",
        "age": 3,
        "sex": "Male",
        "owner_id": "sample-owner-2"
    },
    {
        "id": "sample-pet-3",
        "name": "Bella",
        "species": "Dog",
        "breed": "Golden Retriever",
        "age": 4,
        "sex": "Female",
        "owner_id": "sample-owner-3"
    },
    {
        "id": "sample-pet-4",
        "name": "Coco",
        "species": "Rabbit",
        "breed": "Holland Lop",
        "age": 1,
        "sex": "Male",
        "owner_id": "sample-owner-4"
    },
    {
        "id": "sample-pet-5",
        "name": "Max",
        "species": "Dog",
        "breed": "Aspin",
        "age": 5,
        "sex": "Male",
        "owner_id": "sample-owner-1"
    }
]


# =====================================================
# 3. SAMPLE APPOINTMENTS
# =====================================================

appointments = [
    {
        "id": "sample-appointment-1",
        "pet_id": "sample-pet-1",
        "owner_id": "sample-owner-1",
        "date": "2026-12-01",
        "time": "09:00",
        "service": "Vaccination",
        "status": "Scheduled"
    },
    {
        "id": "sample-appointment-2",
        "pet_id": "sample-pet-2",
        "owner_id": "sample-owner-2",
        "date": "2026-12-02",
        "time": "10:30",
        "service": "General Checkup",
        "status": "Scheduled"
    },
    {
        "id": "sample-appointment-3",
        "pet_id": "sample-pet-3",
        "owner_id": "sample-owner-3",
        "date": "2026-12-03",
        "time": "13:00",
        "service": "Pet Grooming",
        "status": "Scheduled"
    },
    {
        "id": "sample-appointment-4",
        "pet_id": "sample-pet-4",
        "owner_id": "sample-owner-4",
        "date": "2026-11-20",
        "time": "14:00",
        "service": "Health Consultation",
        "status": "Completed"
    },
    {
        "id": "sample-appointment-5",
        "pet_id": "sample-pet-5",
        "owner_id": "sample-owner-1",
        "date": "2026-12-05",
        "time": "15:30",
        "service": "Deworming",
        "status": "Cancelled"
    }
]


# =====================================================
# 4. INSERT SAMPLE RECORDS
# =====================================================

def seed_database():

    batch = db.batch()

    added = 0
    skipped = 0

    collections = {
        "owners": owners,
        "pets": pets,
        "appointments": appointments
    }

    print("=" * 55)
    print("PETCARE - PET CARE MANAGEMENT SYSTEM")
    print("FIRESTORE SAMPLE DATA INITIALIZATION")
    print("=" * 55)

    try:

        for collection_name, records in collections.items():

            print(f"\nProcessing {collection_name.upper()}...")

            for record in records:

                data = record.copy()

                document_id = data.pop("id")

                ref = (
                    db.collection(collection_name)
                    .document(document_id)
                )

                # Prevent duplicate records

                if ref.get().exists:

                    print(f"[SKIPPED] {document_id} already exists.")

                    skipped += 1

                    continue

                # Add timestamps

                data["created_at"] = firestore.SERVER_TIMESTAMP
                data["updated_at"] = firestore.SERVER_TIMESTAMP

                batch.set(ref, data)

                print(f"[QUEUED] {document_id}")

                added += 1

        # Save all new records to Firestore

        if added > 0:

            batch.commit()

        print("\n" + "=" * 55)

        print("[SUCCESS] Sample data initialization completed!")

        print(f"Records added   : {added}")
        print(f"Records skipped : {skipped}")

        print("=" * 55)

        print("\nFirestore collections:")

        for collection_name in collections:

            total = sum(
                1 for _ in db.collection(collection_name).stream()
            )

            print(f" - {collection_name}: {total} records")

        print("\nPetCare is ready to use!")

    except Exception as error:

        print("\n[ERROR] Unable to initialize sample data.")

        print(str(error))

        raise


# =====================================================
# 5. RUN SAMPLE DATA INITIALIZATION
# =====================================================

if __name__ == "__main__":

    seed_database()