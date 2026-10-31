#!/usr/bin/env bash
# ==============================================================================
# Script: setup_github_sync.sh
# Description: Automated, zero-friction sync to push the entire codebase to GitHub.
# Usage:
#   bash setup_github_sync.sh <GITHUB_REPO_URL_OR_NAME>
# Example:
#   bash setup_github_sync.sh https://github.com/your-username/ai-research-velocity-digest.git
# ==============================================================================

set -e

REPO_DEST="$1"

echo "=========================================================="
echo " 🚀 AI Research Velocity Digest - GitHub One-Click Syncer"
echo "=========================================================="

if [ -z "$REPO_DEST" ]; then
    echo "Usage: bash setup_github_sync.sh <GITHUB_REPO_URL>"
    echo "Example: bash setup_github_sync.sh https://github.com/myuser/ai-digest.git"
    echo "Or with SSH: bash setup_github_sync.sh git@github.com:myuser/ai-digest.git"
    exit 1
fi

echo "[1/4] Initializing Git repository..."
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

echo "[2/4] Ensuring clean .gitignore..."
cat << 'EOF' > .gitignore
node_modules/
dist/
.playwright-cli/
output/*.json
output/*.html
__pycache__/
*.pyc
.env
.DS_Store
EOF

echo "[3/4] Staging all files..."
git add .
git commit -m "feat: complete AI Research Velocity Digest pipeline with Sleeping Beauty discovery engine" || echo "No changes to commit."

echo "[4/4] Setting remote origin and pushing to $REPO_DEST..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_DEST"

echo "Pushing code to main branch..."
git push -u origin main --force

echo ""
echo "✅ All code, workflows, and tests have been transferred to GitHub!"
echo "Next step: Add GMAIL_USER and GMAIL_APP_PASSWORD to GitHub Secrets to enable weekly automation."
