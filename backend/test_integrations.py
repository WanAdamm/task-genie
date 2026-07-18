import os
import sys
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent


def test_firebase() -> bool:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        configured_path = os.getenv("FIREBASE_SERVICE_ACCOUNT", "").strip()
        if not configured_path:
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is not set in backend/.env")

        service_account_path = Path(configured_path).expanduser()
        if not service_account_path.is_absolute():
            service_account_path = BACKEND_DIR / service_account_path
        if not service_account_path.is_file():
            raise FileNotFoundError(
                f"Service-account file was not found: {service_account_path}"
            )

        if firebase_admin._apps:
            app = firebase_admin.get_app()
        else:
            app = firebase_admin.initialize_app(
                credentials.Certificate(service_account_path)
            )

        # Read a deliberately nonexistent health document to verify Firestore access
        # without creating, changing, or exposing application data.
        snapshot = firestore.client(app).document("_healthcheck/read_only").get()
        print(
            "[PASS] Firebase Admin and Firestore are reachable "
            f"for project '{app.project_id}' (health document exists: {snapshot.exists})."
        )
        return True
    except Exception as error:
        print(f"[FAIL] Firebase: {type(error).__name__}: {error}")
        return False


def test_gemini() -> bool:
    try:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set in backend/.env")

        client = genai.Client(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
        response = client.models.generate_content(
            model=model_name,
            contents="Reply with exactly: TaskGenie Gemini connection successful",
        )
        response_text = (response.text or "").strip()
        if not response_text:
            raise RuntimeError("Gemini returned an empty response")

        print(f"[PASS] Gemini model '{model_name}' responded: {response_text}")
        return True
    except Exception as error:
        print(f"[FAIL] Gemini: {type(error).__name__}: {error}")
        return False


def main() -> int:
    env_path = BACKEND_DIR / ".env"
    if not env_path.is_file():
        print(f"[FAIL] Environment file was not found: {env_path}")
        return 1

    load_dotenv(env_path)
    print("Testing TaskGenie backend integrations (no data will be written)...")
    firebase_ok = test_firebase()
    gemini_ok = test_gemini()

    if firebase_ok and gemini_ok:
        print("All integrations passed.")
        return 0

    print("One or more integrations failed.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
