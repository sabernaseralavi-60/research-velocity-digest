"""
Email Dispatcher and Templating Module.
Supports Gmail SMTP (TLS 587 / SSL 465), local preview export,
and multi-part (HTML + plaintext) formatting.
"""

import html as _html
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from .config import PipelineConfig
from .models import PipelineReport

logger = logging.getLogger("EmailDispatcher")


class EmailDispatcher:
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.template_path = Path(__file__).parent / "templates" / "digest_email.html"

    def render_html(self, report: PipelineReport) -> str:
        """
        Renders the HTML email template. Uses Jinja2 if available,
        otherwise falls back to python string interpolation.
        """
        try:
            from jinja2 import Environment

            template_content = self.template_path.read_text(encoding="utf-8")
            # autoescape: titles/abstracts come from a public API and are untrusted (F-010)
            template = Environment(autoescape=True).from_string(template_content)
            return template.render(report=report)
        except ImportError:
            logger.info("Jinja2 not installed; rendering using built-in template engine")
            return self._render_fallback_html(report)

    def _render_fallback_html(self, report: PipelineReport) -> str:
        """Lightweight built-in renderer that requires zero 3rd-party dependencies."""
        paper_cards_html = []
        for i, paper in enumerate(report.trending_papers, start=1):
            # every value below comes from a public API: escape it (F-010)
            esc = _html.escape
            authors_str = esc(", ".join(paper.authors))
            title_e, topic_e = esc(paper.title), esc(paper.primary_topic)
            scholar_e, openalex_e = esc(paper.scholar_url, quote=True), esc(paper.openalex_url, quote=True)
            abstract_html = (
                f'<div style="font-size:13px;color:#334155;background:#f8fafc;padding:10px;border-radius:6px;margin:10px 0;border-left:2px solid #cbd5e1;">'
                f'<strong>Key Takeaway:</strong> {esc(paper.abstract)}</div>'
                if paper.abstract else ""
            )
            doi_btn = (
                f'<a href="{esc(paper.doi_url or "", quote=True)}" style="display:inline-block;background:#f1f5f9;color:#334155;text-decoration:none;font-size:12px;font-weight:600;padding:8px 12px;border-radius:6px;border:1px solid #cbd5e1;margin-left:6px;" target="_blank">DOI</a>'
                if paper.doi_url else ""
            )

            card = f"""
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:18px;">
              <div style="margin-bottom:8px;">
                <span style="background:#e2e8f0;color:#334155;font-weight:800;font-size:12px;padding:2px 8px;border-radius:4px;">#{i}</span>
                <span style="background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-weight:700;font-size:12px;padding:2px 8px;border-radius:4px;">⚡ +{paper.recent_citation_velocity} recent citations</span>
                <span style="background:#e0f2fe;color:#0369a1;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;">{topic_e} ({paper.publication_year})</span>
              </div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin:8px 0;">{title_e}</div>
              <div style="font-size:12px;color:#64748b;margin-bottom:10px;">By {authors_str}</div>
              {abstract_html}
              <div style="margin-top:12px;">
                <a href="{scholar_e}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;padding:8px 16px;border-radius:6px;" target="_blank">Open in Google Scholar &rarr;</a>
                <a href="{openalex_e}" style="display:inline-block;background:#f1f5f9;color:#334155;text-decoration:none;font-size:12px;font-weight:600;padding:8px 12px;border-radius:6px;border:1px solid #cbd5e1;margin-left:6px;" target="_blank">OpenAlex</a>
                {doi_btn}
              </div>
            </div>
            """
            paper_cards_html.append(card)

        cards_combined = "\n".join(paper_cards_html)
        return f"""<!DOCTYPE html>
<html>
<body style="background:#0f172a;font-family:sans-serif;margin:0;padding:20px;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <div style="background:#1e293b;padding:28px;color:#ffffff;">
      <span style="background:rgba(59,130,246,0.2);color:#93c5fd;font-size:11px;font-weight:700;padding:3px 8px;border-radius:9999px;">WEEKLY INVERTED CITATION DIGEST</span>
      <h1 style="margin:10px 0 6px 0;font-size:22px;">AI Research Velocity Digest</h1>
      <p style="margin:0;font-size:13px;color:#94a3b8;">Trending papers across AI, ML, Computer Vision ({report.start_date} to {report.end_date})</p>
    </div>
    <div style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">
      Scanned <strong>{report.recent_papers_scanned}</strong> recent papers &bull; Extracted <strong>{report.total_references_extracted}</strong> references &bull; Cutoff: &ge;<strong>{report.trending_threshold}</strong> citations
    </div>
    <div style="padding:20px;">
      {cards_combined}
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
      AI Research Velocity Digest &bull; Delivered via GitHub Actions &bull; {report.execution_time_seconds:.2f}s
    </div>
  </div>
</body>
</html>"""

    def render_plaintext(self, report: PipelineReport) -> str:
        """Builds plain text fallback for terminal and non-HTML mail clients."""
        lines = [
            "=" * 60,
            "AI RESEARCH VELOCITY DIGEST",
            f"Trending Papers Detected: {report.start_date} to {report.end_date}",
            f"Scanned {report.recent_papers_scanned} recent papers | Velocity Cutoff >= {report.trending_threshold}",
            "=" * 60,
            "",
        ]

        for i, paper in enumerate(report.trending_papers, start=1):
            lines.append(f"#{i} [{paper.recent_citation_velocity} new citations] {paper.title}")
            lines.append(f"Authors: {', '.join(paper.authors)} ({paper.publication_year})")
            lines.append(f"Topic: {paper.primary_topic}")
            lines.append(f"Google Scholar Link: {paper.scholar_url}")
            lines.append(f"OpenAlex Link: {paper.openalex_url}")
            if paper.abstract:
                lines.append(f"Summary: {paper.abstract}")
            lines.append("-" * 50)
            lines.append("")

        return "\n".join(lines)

    def save_preview_html(self, report: PipelineReport, filepath: str = "output/digest_preview.html") -> str:
        """Saves generated email to local file for preview and inspection."""
        html = self.render_html(report)
        out_path = Path(filepath)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html, encoding="utf-8")
        logger.info(f"Saved email preview to {out_path.resolve()}")
        return str(out_path.resolve())

    def dispatch(self, report: PipelineReport, recipient: Optional[str] = None) -> bool:
        """
        Sends the compiled email digest via SMTP (e.g. Gmail).
        Returns True if sent successfully, False otherwise.
        """
        target_recipient = recipient or self.config.recipient_email
        if not target_recipient:
            logger.error("No recipient email specified.")
            return False

        if not self.config.smtp_user or not self.config.smtp_password:
            logger.warning(
                "SMTP credentials (SMTP_USER or SMTP_PASSWORD) not configured. "
                "Email dispatch skipped. Running in preview/dry-run mode."
            )
            return False

        subject = (
            f"⚡ AI Research Velocity Digest: {len(report.trending_papers)} Trending Papers "
            f"({report.start_date} to {report.end_date})"
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AI Research Digest <{self.config.smtp_user}>"
        msg["To"] = target_recipient

        # Attach Plaintext and HTML parts
        plain_text = self.render_plaintext(report)
        html_text = self.render_html(report)

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_text, "html", "utf-8"))

        try:
            logger.info(f"Connecting to SMTP server {self.config.smtp_host}:{self.config.smtp_port}...")
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port, timeout=30) as server:
                if self.config.smtp_use_tls:
                    server.starttls()
                server.login(self.config.smtp_user, self.config.smtp_password)
                server.sendmail(self.config.smtp_user, [target_recipient], msg.as_string())

            logger.info(f"Successfully delivered email digest to {target_recipient}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email via SMTP: {e}")
            return False
