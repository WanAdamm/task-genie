import os

import firebase_admin
from firebase_admin import credentials, firestore


def get_firestore_client():
    if not firebase_admin._apps:
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")

        if not service_account_path:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT is not set. "
                "Point it to your Firebase service account JSON file."
            )

        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)

    return firestore.client()


def get_events_collection():
    db = get_firestore_client()
    return db.collection("events")