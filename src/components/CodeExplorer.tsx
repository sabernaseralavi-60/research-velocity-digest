import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, GitFork, ShieldCheck } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

const PIPELINE_FILES: CodeFile[] = [
  {
    name: 'main.py',
    path: 'pipeline/main.py',
    language: 'python',
    content: `"""
Main CLI entry point for AI Research Velocity Digest Pipeline.
"""
import argparse, json, logging, sys
from dataclasses import asdict
from pathlib import Path
from .config import PipelineConfig, get_config
from .fetcher import OpenAlexClient
from .analyzer import InvertedCitationAnalyzer
from .mailer import EmailDispatcher

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("Main")

def run_pipeline():
    parser = argparse.ArgumentParser(description="AI Research Velocity Digest")
    parser.add_argument("--days", type=int, default=7, help="Lookback window in days")
    parser.add_argument("--min-citations", type=int, default=5, help="Citation velocity threshold")
    parser.add_argument("--top-n", type=int, default=15, help="Max trending papers in digest")
    parser.add_argument("--email", type=str, default=None, help="Recipient email")
    parser.add_argument("--dry-run", action="store_true", help="Preview HTML without sending email")
    parser.add_argument("--export-json", type=str, default=None, help="Export JSON results")
    args = parser.parse_args()

    config = get_config()
    if args.days: config.lookback_days = args.days
    if args.min_citations: config.min_citation_velocity = args.min_citations
    if args.email: config.recipient_email = args.email

    client = OpenAlexClient(config)
    analyzer = InvertedCitationAnalyzer(config, client)
    dispatcher = EmailDispatcher(config)

    report = analyzer.analyze()
    dispatcher.save_preview_html(report, "output/digest_preview.html")

    if args.export_json:
        Path(args.export_json).write_text(json.dumps(asdict(report), indent=2))

    if args.dry_run or not (config.smtp_user and config.smtp_password):
        print(dispatcher.render_plaintext(report))
        return 0

    return 0 if dispatcher.dispatch(report) else 1

if __name__ == "__main__":
    sys.exit(run_pipeline())
`,
  },
  {
    name: 'analyzer.py',
    path: 'pipeline/analyzer.py',
    language: 'python',
    content: `"""
Inverted Citation Indexing and Research Velocity Analyzer Module.
"""
from collections import Counter
from datetime import datetime, timedelta
import logging, time
from .config import PipelineConfig
from .models import RecentPaper, TrendingPaper, PipelineReport
from .scholar import generate_scholar_url, reconstruct_abstract_inverted_index

logger = logging.getLogger("VelocityAnalyzer")

class InvertedCitationAnalyzer:
    def __init__(self, config: PipelineConfig, client):
        self.config = config
        self.client = client

    def analyze(self) -> PipelineReport:
        # Step 1: Ingest newly published papers in recent lookback window
        recent_papers = self.client.fetch_recent_papers()

        # Step 2: Build Inverted Reference Index (extract referenced_works -> counter)
        ref_counter = Counter()
        citing_map = {}
        for paper in recent_papers:
            for ref_id in set(paper.referenced_works):
                norm_id = ref_id.split("/")[-1]
                ref_counter[norm_id] += 1
                citing_map.setdefault(norm_id, []).append(paper.title)

        # Step 3: Filter by dynamic velocity threshold
        top_candidates = [
            (wid, cnt) for wid, cnt in ref_counter.most_common()
            if cnt >= self.config.min_citation_velocity
        ][: self.config.top_n_papers]

        # Step 4: Hydrate top works with metadata & generate direct Scholar links
        hydrated = self.client.hydrate_papers_batch([wid for wid, _ in top_candidates])
        # Build TrendingPaper objects with direct Google Scholar links...
        return report
`,
  },
  {
    name: 'fetcher.py',
    path: 'pipeline/fetcher.py',
    language: 'python',
    content: `"""
OpenAlex Data Ingestion Module with Polite Pool and Exponential Backoff.
"""
import urllib.request, json, time, logging
from .models import RecentPaper

class OpenAlexClient:
    BASE_URL = "https://api.openalex.org/works"

    def __init__(self, config):
        self.config = config
        self.user_agent = f"AI-Research-Velocity-Digest/1.0 (mailto:{self.config.polite_email})"

    def fetch_recent_papers(self):
        # Query OpenAlex with polite pool header mailto:
        # Filter by publication_date in recent window and concepts for AI/ML/CV/Soft Computing
        pass

    def hydrate_papers_batch(self, work_ids):
        # Batch hydrates OpenAlex work IDs in chunks of 40
        pass
`,
  },
  {
    name: 'scholar.py',
    path: 'pipeline/scholar.py',
    language: 'python',
    content: `"""
Google Scholar Link Generation with Exact-Phrase Title Matching.
"""
import urllib.parse, re

def generate_scholar_url(title: str, first_author=None, year=None) -> str:
    cleaned = re.sub(r"<[^>]+>", "", title).strip()
    cleaned = re.sub(r"(\\.{3,}|[.,:;…]+)$", "", cleaned).strip()
    if len(cleaned) > 200:
        cleaned = cleaned[:197] + "..."

    params = {"q": f'"{cleaned}"'}
    if year and 1950 <= year <= 2030:
        params["as_ylo"] = str(year)

    return f"https://scholar.google.com/scholar?{urllib.parse.urlencode(params)}"
`,
  },
  {
    name: 'mailer.py',
    path: 'pipeline/mailer.py',
    language: 'python',
    content: `"""
Email Dispatcher supporting Gmail SMTP (TLS 587) with App Passwords.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

class EmailDispatcher:
    def dispatch(self, report, recipient=None):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚡ AI Research Velocity Digest: {len(report.trending_papers)} Papers"
        msg["From"] = f"AI Digest <{self.config.smtp_user}>"
        msg["To"] = recipient or self.config.recipient_email
        msg.attach(MIMEText(self.render_plaintext(report), "plain"))
        msg.attach(MIMEText(self.render_html(report), "html"))

        with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
            if self.config.smtp_use_tls:
                server.starttls()
            server.login(self.config.smtp_user, self.config.smtp_password)
            server.sendmail(self.config.smtp_user, [msg["To"]], msg.as_string())
        return True
`,
  },
  {
    name: 'weekly_digest.yml',
    path: '.github/workflows/weekly_digest.yml',
    language: 'yaml',
    content: `name: Weekly AI Research Velocity Digest

on:
  schedule:
    # Runs every Monday at 09:00 UTC (02:00 AM PT / 05:00 AM ET)
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  run-digest-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - name: Execute Inverted Citation Digest
        env:
          OPENALEX_POLITE_EMAIL: \${{ secrets.OPENALEX_POLITE_EMAIL }}
          SMTP_USER: \${{ secrets.GMAIL_USER }}
          SMTP_PASSWORD: \${{ secrets.GMAIL_APP_PASSWORD }}
          RECIPIENT_EMAIL: \${{ secrets.RECIPIENT_EMAIL }}
        run: python -m pipeline.main --export-json output/digest.json
      - uses: actions/upload-artifact@v4
        with:
          name: digest-output
          path: output/
`,
  },
  {
    name: 'Dockerfile',
    path: 'Dockerfile',
    language: 'dockerfile',
    content: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY pipeline/ ./pipeline/
ENTRYPOINT ["python", "-m", "pipeline.main"]
CMD ["--dry-run"]
`,
  },
];

export const CodeExplorer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = PIPELINE_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Production Python Pipeline &amp; Workflows
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Zero-cost GitHub Actions &bull; Python 3.10+
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied File' : 'Copy File'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-[520px]">
        {/* Sidebar file list */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-2 space-y-1">
          {PIPELINE_FILES.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                selectedFileIndex === idx
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="text-[10px] opacity-70 uppercase tracking-wider">
                {file.language}
              </span>
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 bg-slate-950 p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed">
          <div className="text-[11px] text-slate-500 pb-2 mb-3 border-b border-slate-800/80 flex items-center justify-between">
            <span>Path: {currentFile.path}</span>
            <span className="text-slate-600">{currentFile.content.split('\n').length} lines</span>
          </div>
          <pre className="text-slate-300 font-mono text-[12px] whitespace-pre overflow-x-auto">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
