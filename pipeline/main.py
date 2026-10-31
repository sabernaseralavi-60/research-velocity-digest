"""
Main CLI entry point for AI Research Velocity Digest Pipeline.

Usage:
    python -m pipeline.main --dry-run
    python -m pipeline.main --days 7 --min-citations 10 --email user@example.com
"""

import argparse
import json
import logging
import sys
from dataclasses import asdict
from pathlib import Path

from .config import PipelineConfig, get_config
from .fetcher import OpenAlexClient
from .analyzer import InvertedCitationAnalyzer
from .mailer import EmailDispatcher

# Configure rich console logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("Main")


def parse_args():
    parser = argparse.ArgumentParser(
        description="AI Research Velocity Digest: Inverted Citation Indexing Pipeline"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=None,
        help="Number of lookback days for newly published papers (default: 7)",
    )
    parser.add_argument(
        "--min-citations",
        type=int,
        default=None,
        help="Minimum citation velocity threshold from recent batch (default: 5)",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=None,
        help="Maximum trending papers to include in digest (default: 15)",
    )
    parser.add_argument(
        "--email",
        type=str,
        default=None,
        help="Recipient email address for digest delivery",
    )
    parser.add_argument(
        "--polite-email",
        type=str,
        default=None,
        help="OpenAlex polite pool contact email",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Execute pipeline, print summary, and save HTML preview without sending email",
    )
    parser.add_argument(
        "--export-json",
        type=str,
        default=None,
        help="Optional file path to export pipeline results in JSON format",
    )
    parser.add_argument(
        "--output-html",
        type=str,
        default="output/digest_preview.html",
        help="File path to save the HTML digest preview (default: output/digest_preview.html)",
    )
    return parser.parse_args()


def run_pipeline():
    args = parse_args()
    config = get_config()

    # Override config with CLI arguments if provided
    if args.days is not None:
        config.lookback_days = args.days
    if args.min_citations is not None:
        config.min_citation_velocity = args.min_citations
    if args.top_n is not None:
        config.top_n_papers = args.top_n
    if args.email is not None:
        config.recipient_email = args.email
    if args.polite_email is not None:
        config.polite_email = args.polite_email

    logger.info("=" * 60)
    logger.info("Starting AI Research Velocity Digest Pipeline")
    logger.info(f"Lookback window: {config.lookback_days} days")
    logger.info(f"Minimum velocity threshold: {config.min_citation_velocity}")
    logger.info(f"Polite pool email: {config.polite_email}")
    logger.info("=" * 60)

    # Initialize modules
    client = OpenAlexClient(config)
    analyzer = InvertedCitationAnalyzer(config, client)
    dispatcher = EmailDispatcher(config)

    # Execute Inverted Citation Indexing
    report = analyzer.analyze()

    # Save HTML preview
    preview_file = dispatcher.save_preview_html(report, args.output_html)
    logger.info(f"HTML Digest Preview saved to: {preview_file}")

    # Export JSON if requested
    if args.export_json:
        export_path = Path(args.export_json)
        export_path.parent.mkdir(parents=True, exist_ok=True)
        # Convert report dataclass to dict
        report_dict = asdict(report)
        export_path.write_text(json.dumps(report_dict, indent=2), encoding="utf-8")
        logger.info(f"JSON analysis results exported to: {export_path.resolve()}")

    # Dispatch email or run in dry-run mode
    if args.dry_run:
        logger.info("Dry-run mode active. Email dispatch skipped.")
        print("\n" + dispatcher.render_plaintext(report))
        return 0

    if config.smtp_user and config.smtp_password and config.recipient_email:
        success = dispatcher.dispatch(report)
        if success:
            logger.info("Email delivered successfully!")
            return 0
        else:
            logger.error("Failed to send email. Check credentials and network.")
            return 1
    else:
        logger.warning(
            "SMTP credentials not fully configured (set SMTP_USER and SMTP_PASSWORD in .env). "
            "Digest saved locally to HTML preview."
        )
        return 0


if __name__ == "__main__":
    sys.exit(run_pipeline())
