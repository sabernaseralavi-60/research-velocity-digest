# AI Research Velocity Digest

> Automated Inverted-Indexing Pipeline that identifies trending, highly-cited research papers in Artificial Intelligence, Machine Learning, Deep Learning, Computer Vision, and Soft Computing, and periodically delivers a curated digest to your inbox with direct Google Scholar links.

---

## 1. System Architecture & The Inverted Indexing Solution

### The Scale Problem
Standard approaches attempt to monitor citations by scraping or querying hundreds of thousands of historical papers. With over 250M cataloged scientific publications, polling historical works causes:
- Aggressive API rate limits and IP throttling.
- $O(N_{\text{all\_papers}} \times \text{query\_frequency})$ compute complexity.
- Stale data and missed breakthrough preprints.

### The Inverted Indexing Solution
Instead of tracking historical papers, the pipeline inspects **only** the newly published/indexed papers from the past 7 days across target AI/ML subfields using OpenAlex's free, open API.
1. **Window Ingestion:** Ingests $N_{\text{recent}}$ papers indexed in the past 7 days with polite pool headers (`mailto:user@domain.com`).
2. **Inverted Reference Extraction:** Extracts the `referenced_works` list from each recent paper, flipping the graph:
   $$\text{Recent Papers } \{P_1, P_2, \dots\} \longrightarrow \text{References } \{R_a, R_b, \dots\} \longrightarrow \text{Frequency Count } \mathcal{F}(R_i)$$
3. **Velocity Thresholding:** Filters for papers whose recent citation count $\mathcal{F}(R_i) \ge \text{threshold}$ (e.g. $\ge 5$ or $10$ citations accumulated strictly in the recent week).
4. **Hydration & Google Scholar Linking:** Batches and hydrates detailed metadata for top candidates, reconstructing abstracts and generating exact-match direct Google Scholar search links (`https://scholar.google.com/scholar?q="Title"`).
5. **Multi-Channel Dispatch:** Renders an elegant, responsive HTML email digest and delivers it via Gmail SMTP or GitHub Actions.

---

## 2. Quickstart (Local Run)

### Prerequisites
- Python 3.10+
- (Optional) Docker

```bash
# Clone the repository
git clone <repo-url>
cd ai-research-velocity-digest

# Install dependencies
pip install -r requirements.txt

# Run dry-run test (generates HTML preview in output/digest_preview.html)
python -m pipeline.main --dry-run
```

---

## 3. Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `OPENALEX_POLITE_EMAIL` | Your email address (grants 10 req/s polite pool access) | `saber.naseralavi@gmail.com` |
| `LOOKBACK_DAYS` | Window for newly published papers | `7` |
| `MIN_CITATION_VELOCITY` | Minimum citations in recent batch to flag paper | `5` |
| `TOP_N_PAPERS` | Max trending papers to include in digest | `15` |
| `SMTP_HOST` | Outgoing SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (TLS) | `587` |
| `SMTP_USER` | Gmail address | `your_account@gmail.com` |
| `SMTP_PASSWORD` | Gmail 16-character App Password | *(Required for live email)* |
| `RECIPIENT_EMAIL` | Digest destination email | `user@example.com` |

---

## 4. Gmail App Password Setup Guide

If using Gmail to dispatch your digest:
1. Go to your **Google Account** > **Security** (`https://myaccount.google.com/security`).
2. Ensure **2-Step Verification** is enabled.
3. In the search bar at the top of Google Account, search for **"App Passwords"**.
4. Create a new App Password:
   - App name: `AI Paper Digest`
   - Click **Create**.
5. Copy the generated 16-character code (e.g., `abcd efgh ijkl mnop`).
6. Set `SMTP_PASSWORD="abcdefghijklmnop"` in your `.env` or GitHub Secrets.

---

## 5. Zero-Cost Automation via GitHub Actions

This repository includes a scheduled GitHub Actions workflow in `.github/workflows/weekly_digest.yml`.

### Setting up GitHub Secrets:
1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** and add:
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_APP_PASSWORD`: The 16-character Gmail App Password
   - `RECIPIENT_EMAIL`: Target email address to receive the digest
   - `OPENALEX_POLITE_EMAIL`: Your email for OpenAlex polite pool
3. The workflow automatically runs **every Monday at 09:00 UTC**.
4. You can also trigger it manually at any time under the **Actions** tab with the **Run workflow** button.

---

## 6. Docker Deployment

```bash
# Build the container
docker build -t ai-velocity-digest .

# Run container with dry-run
docker run --rm -v $(pwd)/output:/app/output ai-velocity-digest --dry-run
```
