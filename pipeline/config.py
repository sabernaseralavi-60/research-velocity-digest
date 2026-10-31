"""
Configuration and settings module for AI Research Velocity Digest pipeline.
Loads settings from environment variables or .env file with sensible defaults.
"""

import os
from dataclasses import dataclass, field
from typing import List
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


@dataclass
class PipelineConfig:
    # OpenAlex API Polite Pool Email (grants 10 req/s instead of 1 req/s)
    polite_email: str = os.getenv("OPENALEX_POLITE_EMAIL", "saber.naseralavi@gmail.com")

    # Time window for newly published papers (days)
    lookback_days: int = int(os.getenv("LOOKBACK_DAYS", "7"))

    # Minimum citation frequency from the recent paper batch to flag as trending
    min_citation_velocity: int = int(os.getenv("MIN_CITATION_VELOCITY", "5"))

    # Maximum trending papers to include in the email digest
    top_n_papers: int = int(os.getenv("TOP_N_PAPERS", "15"))

    # Max recent papers to scan in the lookback window (controls API budget)
    max_recent_papers_to_scan: int = int(os.getenv("MAX_RECENT_PAPERS_TO_SCAN", "300"))

    # AI & Computing subfields / concept IDs in OpenAlex
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

    # OpenAlex Concept IDs:
    # C154945302 = Artificial Intelligence
    # C119857082 = Machine Learning
    # C108827166 = Computer Vision
    # C127413603 = Pattern Recognition
    concept_ids: List[str] = field(
        default_factory=lambda: [
            "C154945302",
            "C119857082",
            "C108827166",
        ]
    )

    # SMTP Email Dispatcher Settings
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")  # 16-char App Password for Gmail
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    
    # Destination recipient(s) for the weekly email digest
    recipient_email: str = os.getenv("RECIPIENT_EMAIL", os.getenv("DIGEST_RECIPIENT", "saber.naseralavi@gmail.com"))

    # Output / export folder
    output_dir: str = os.getenv("OUTPUT_DIR", "./output")


def get_config() -> PipelineConfig:
    """Returns singleton pipeline configuration instance."""
    return PipelineConfig()
