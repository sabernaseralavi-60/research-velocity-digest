"""
Configuration and settings module for AI Research Velocity Digest pipeline.
Loads settings from environment variables or .env file with sensible defaults.
No personal address is a default: set OPENALEX_POLITE_EMAIL / RECIPIENT_EMAIL in the environment.
"""

import os
from dataclasses import dataclass, field
from typing import List
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "")
    try:
        return int(raw) if raw.strip() else default
    except ValueError:
        return default


@dataclass
class PipelineConfig:
    # OpenAlex API Polite Pool contact (grants the faster polite pool when set)
    polite_email: str = field(default_factory=lambda: os.getenv("OPENALEX_POLITE_EMAIL", ""))

    # OpenAlex API key (free at openalex.org/settings/api): without one all requests from a network share a
    # small daily budget, which a scheduled job on shared CI IPs can exhaust
    openalex_api_key: str = field(default_factory=lambda: os.getenv("OPENALEX_API_KEY", ""))

    # Time window for newly published papers (days)
    lookback_days: int = field(default_factory=lambda: _int_env("LOOKBACK_DAYS", 7))

    # Minimum citation frequency from the recent paper batch to flag as trending
    min_citation_velocity: int = field(default_factory=lambda: _int_env("MIN_CITATION_VELOCITY", 5))

    # Maximum trending papers to include in the email digest
    top_n_papers: int = field(default_factory=lambda: _int_env("TOP_N_PAPERS", 15))

    # Max recent papers to scan per topic and run (controls API budget and database growth)
    max_recent_papers_to_scan: int = field(default_factory=lambda: _int_env("MAX_RECENT_PAPERS_TO_SCAN", 300))

    # Persistence: a Postgres URL (Neon) or a SQLite path; empty = local SQLite file
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL", ""))

    # AI & Computing subfields shown in the digest header
    subfields: List[str] = field(
        default_factory=lambda: [
            "Artificial Intelligence",
            "Machine Learning",
            "Deep Learning",
            "Computer Vision",
            "Soft Computing",
            "Natural Language Processing",
        ]
    )

    # OpenAlex Concept IDs for the default AI topic:
    # C154945302 = Artificial Intelligence, C119857082 = Machine Learning, C108827166 = Computer Vision
    concept_ids: List[str] = field(
        default_factory=lambda: [
            "C154945302",
            "C119857082",
            "C108827166",
        ]
    )

    # SMTP Email Dispatcher Settings
    smtp_host: str = field(default_factory=lambda: os.getenv("SMTP_HOST", "smtp.gmail.com"))
    smtp_port: int = field(default_factory=lambda: _int_env("SMTP_PORT", 587))
    smtp_user: str = field(default_factory=lambda: os.getenv("SMTP_USER", ""))
    smtp_password: str = field(default_factory=lambda: os.getenv("SMTP_PASSWORD", ""))  # Gmail app password
    smtp_use_tls: bool = field(default_factory=lambda: os.getenv("SMTP_USE_TLS", "true").lower() == "true")

    # Destination recipient for the digest (no default)
    recipient_email: str = field(
        default_factory=lambda: os.getenv("RECIPIENT_EMAIL", os.getenv("DIGEST_RECIPIENT", ""))
    )

    # Output / export folder
    output_dir: str = field(default_factory=lambda: os.getenv("OUTPUT_DIR", "./output"))


def get_config() -> PipelineConfig:
    """Returns a fresh pipeline configuration read from the current environment."""
    return PipelineConfig()
