#!/bin/bash

# --- EXTRACT REPOSITORY SCRIPT ---
# This script extracts your project from the 'opssightai' monorepo
# and pushes it completely out to your standalone ai-compliance-platform.git repository

echo "Extracting ai-compliance-platform standalone..."
cd /Users/alpfr/Downloads/scripts/ai-compliance-platform

# Remove overlapping git tracking from the monorepo just for this folder natively
rm -rf .git

# Initialize entirely fresh Git Database
git init

# Stage exactly the files we generated (including CLOUD_RUN_DEPLOYMENT.md)
git add .

# Safe commit 
git commit -m "docs: complete PostgreSQL integration, Vite upgrade, and Cloud Run deployments"

# Link to your external specific remote
git branch -M main
git remote add origin https://github.com/alpfr/ai-compliance-platform.git

# Push it to GitHub
echo "Pushing directly to your repository..."
git push -u origin main --force

echo "✅ Done! Refresh your Chrome browser on https://github.com/alpfr/ai-compliance-platform"
