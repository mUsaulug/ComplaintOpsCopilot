from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from threading import Lock
from typing import Optional
import os
import sqlite3
import base64
import hashlib
import logging

# Conditional import for encryption
try:
    from cryptography.fernet import Fernet
    ENCRYPTION_AVAILABLE = True
except ImportError:
    ENCRYPTION_AVAILABLE = False

logger = logging.getLogger("complaintops.review_store")


# === Encryption Helpers ===

def _get_encryption_key() -> bytes:
    """
    Get encryption key from environment.
    In production, use a proper secret manager (HashiCorp Vault, AWS Secrets Manager, etc.)
    """
    key = os.getenv("REVIEW_ENCRYPTION_KEY")
    if key:
        return key.encode()
    
    # Development fallback - generates consistent key from a seed
    # WARNING: Not secure for production! Set REVIEW_ENCRYPTION_KEY env var.
    logger.warning("REVIEW_ENCRYPTION_KEY not set. Using development fallback (NOT SECURE).")
    return base64.urlsafe_b64encode(hashlib.sha256(b"complaintops-dev-key-2024").digest())


def _encrypt(text: str) -> str:
    """Encrypt text using Fernet symmetric encryption."""
    if not text or not ENCRYPTION_AVAILABLE:
        return text
    try:
        f = Fernet(_get_encryption_key())
        return f.encrypt(text.encode()).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        return text  # Fallback to plaintext if encryption fails


def _decrypt(encrypted_text: str) -> str:
    """Decrypt text using Fernet symmetric encryption."""
    if not encrypted_text or not ENCRYPTION_AVAILABLE:
        return encrypted_text
    try:
        f = Fernet(_get_encryption_key())
        return f.decrypt(encrypted_text.encode()).decode()
    except Exception as e:
        # If decryption fails, might be plaintext from before encryption was enabled
        logger.warning(f"Decryption failed (might be plaintext): {e}")
        return encrypted_text


# === Configuration ===

RETENTION_DAYS = int(os.getenv("REVIEW_RETENTION_DAYS", "90"))
ENCRYPTION_ENABLED = os.getenv("REVIEW_ENCRYPTION_ENABLED", "true").lower() == "true"


@dataclass
class ReviewRecord:
    review_id: str
    status: str
    created_at: str
    updated_at: str
    masked_text: str
    category: str
    category_confidence: float
    urgency: str
    urgency_confidence: float
    notes: Optional[str] = None


class ReviewStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._db_path = os.getenv("REVIEW_DB_PATH", "reviews.db")
        self._init_db()
        
        # Log configuration
        if ENCRYPTION_AVAILABLE and ENCRYPTION_ENABLED:
            logger.info("ReviewStore initialized with encryption ENABLED")
        else:
            logger.warning("ReviewStore initialized WITHOUT encryption")
        logger.info(f"Retention policy: {RETENTION_DAYS} days")

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS review_records (
                    review_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    masked_text TEXT NOT NULL,
                    category TEXT NOT NULL,
                    category_confidence REAL NOT NULL,
                    urgency TEXT NOT NULL,
                    urgency_confidence REAL NOT NULL,
                    notes TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS review_audit (
                    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    review_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    notes TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )

    def create_review(
        self,
        review_id: str,
        masked_text: str,
        category: str,
        category_confidence: float,
        urgency: str,
        urgency_confidence: float,
    ) -> ReviewRecord:
        now = datetime.now(timezone.utc).isoformat()
        
        # Encrypt sensitive field before storage
        encrypted_text = _encrypt(masked_text) if ENCRYPTION_ENABLED else masked_text
        
        record = ReviewRecord(
            review_id=review_id,
            status="PENDING_REVIEW",
            created_at=now,
            updated_at=now,
            masked_text=masked_text,  # Return decrypted for caller
            category=category,
            category_confidence=category_confidence,
            urgency=urgency,
            urgency_confidence=urgency_confidence,
        )
        with self._lock, self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO review_records (
                    review_id, status, created_at, updated_at, masked_text, category,
                    category_confidence, urgency, urgency_confidence, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.review_id,
                    record.status,
                    record.created_at,
                    record.updated_at,
                    encrypted_text,  # Store encrypted
                    record.category,
                    record.category_confidence,
                    record.urgency,
                    record.urgency_confidence,
                    record.notes,
                ),
            )
            conn.execute(
                """
                INSERT INTO review_audit (review_id, status, notes, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (record.review_id, record.status, record.notes, now),
            )
        return record

    def update_review(self, review_id: str, status: str, notes: Optional[str] = None) -> Optional[ReviewRecord]:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock, self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT * FROM review_records WHERE review_id = ?
                """,
                (review_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            conn.execute(
                """
                UPDATE review_records
                SET status = ?, updated_at = ?, notes = ?
                WHERE review_id = ?
                """,
                (status, now, notes, review_id),
            )
            conn.execute(
                """
                INSERT INTO review_audit (review_id, status, notes, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (review_id, status, notes, now),
            )
            
            # Decrypt masked_text when reading
            decrypted_text = _decrypt(row["masked_text"]) if ENCRYPTION_ENABLED else row["masked_text"]
            
            return ReviewRecord(
                review_id=row["review_id"],
                status=status,
                created_at=row["created_at"],
                updated_at=now,
                masked_text=decrypted_text,
                category=row["category"],
                category_confidence=row["category_confidence"],
                urgency=row["urgency"],
                urgency_confidence=row["urgency_confidence"],
                notes=notes,
            )

    def get_review(self, review_id: str) -> Optional[ReviewRecord]:
        """Get a review by ID with decrypted masked_text."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM review_records WHERE review_id = ?",
                (review_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            
            decrypted_text = _decrypt(row["masked_text"]) if ENCRYPTION_ENABLED else row["masked_text"]
            
            return ReviewRecord(
                review_id=row["review_id"],
                status=row["status"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                masked_text=decrypted_text,
                category=row["category"],
                category_confidence=row["category_confidence"],
                urgency=row["urgency"],
                urgency_confidence=row["urgency_confidence"],
                notes=row["notes"],
            )

    def cleanup_expired_reviews(self) -> int:
        """
        Delete reviews older than RETENTION_DAYS.
        Should be called periodically (e.g., daily cron job).
        Returns count of deleted records.
        """
        cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
        with self._lock, self._get_connection() as conn:
            # First, audit the deletions
            conn.execute(
                """
                INSERT INTO review_audit (review_id, status, notes, created_at)
                SELECT review_id, 'DELETED_RETENTION', ?, ?
                FROM review_records WHERE created_at < ?
                """,
                (f"Auto-deleted after {RETENTION_DAYS} days", datetime.now(timezone.utc).isoformat(), cutoff),
            )
            # Then delete
            cursor = conn.execute(
                "DELETE FROM review_records WHERE created_at < ?",
                (cutoff,),
            )
            deleted_count = cursor.rowcount
            if deleted_count > 0:
                logger.info(f"Retention cleanup: Deleted {deleted_count} reviews older than {RETENTION_DAYS} days")
            return deleted_count


review_store = ReviewStore()
