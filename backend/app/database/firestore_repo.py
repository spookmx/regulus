import os
from typing import Dict, Any, Optional, List
import firebase_admin
from firebase_admin import credentials, firestore

class FirestoreRepository:
    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id or os.getenv("FIREBASE_PROJECT_ID", "regulus-dev")
        self._db = None

    def get_db(self):
        if self._db is not None:
            return self._db

        # Initialize firebase_admin app if not already initialized
        if not firebase_admin._apps:
            # Check if emulator is set
            emulator_host = os.getenv("FIRESTORE_EMULATOR_HOST")
            if emulator_host:
                # Use anonymous credentials for emulator
                cred = credentials.AnonymousCredentials() if hasattr(credentials, 'AnonymousCredentials') else credentials.ApplicationDefault()
                try:
                    firebase_admin.initialize_app(options={"projectId": self.project_id})
                except Exception:
                    # Fallback initialize with creds
                    firebase_admin.initialize_app(credential=credentials.ApplicationDefault(), options={"projectId": self.project_id})
            else:
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {"projectId": self.project_id})
                except Exception:
                    # Fallback for local testing without default GCP creds
                    firebase_admin.initialize_app(options={"projectId": self.project_id})

        self._db = firestore.client()
        return self._db

    # --- Bronze Tier (Raw document blobs / version history) ---

    def save_bronze_artifact(self, artifact_id: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Save raw document blob to Cloud Firestore 'artifacts/' collection."""
        db = self.get_db()
        doc_ref = db.collection("artifacts").document(artifact_id)
        doc_data = {
            "artifact_id": artifact_id,
            "raw_content": content,
            "metadata": metadata or {},
            "stored_at": firestore.SERVER_TIMESTAMP,
        }
        doc_ref.set(doc_data, merge=True)
        return doc_data

    def get_bronze_artifact(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve raw document blob from Cloud Firestore 'artifacts/' collection."""
        db = self.get_db()
        doc = db.collection("artifacts").document(artifact_id).get()
        return doc.to_dict() if doc.exists else None

    # --- Silver Tier (Structured artifact fields / derived data) ---

    def save_silver_artifact(self, artifact_type: str, artifact_id: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save structured artifact fields to Cloud Firestore 'derived/{artifact_type}/items/{artifact_id}'."""
        db = self.get_db()
        doc_ref = db.collection("derived").document(artifact_type).collection("items").document(artifact_id)
        payload = {
            **structured_data,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        doc_ref.set(payload, merge=True)
        return payload

    def get_silver_artifact(self, artifact_type: str, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve structured artifact fields from Cloud Firestore Silver tier."""
        db = self.get_db()
        doc = db.collection("derived").document(artifact_type).collection("items").document(artifact_id).get()
        return doc.to_dict() if doc.exists else None

    def list_silver_artifacts(self, artifact_type: str) -> List[Dict[str, Any]]:
        """List all structured artifacts of a specific type in Silver tier."""
        db = self.get_db()
        docs = db.collection("derived").document(artifact_type).collection("items").stream()
        return [doc.to_dict() for doc in docs]
