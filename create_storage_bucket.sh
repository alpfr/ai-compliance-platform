#!/bin/bash
# AI Compliance Platform - Cloud Storage Provisioning Script
# This script provisions securely configured Cloud Storage buckets for documents

# Set variables
PROJECT_ID=$(gcloud config get-value project)
BUCKET_NAME="ai-compliance-storage-${PROJECT_ID}"
REGION="us-central1" # Update this if your GKE cluster is in a different region

echo "📦 Creating Google Cloud Storage Bucket: gs://$BUCKET_NAME in $REGION..."

# 1. Create the bucket seamlessly if it doesn't already exist
if gcloud storage ls "gs://$BUCKET_NAME" >/dev/null 2>&1; then
    echo "✅ Bucket gs://$BUCKET_NAME already exists! Skipping creation."
else
    # Create the bucket with uniform bucket-level access enabled for enterprise security
    gcloud storage buckets create "gs://$BUCKET_NAME" \
        --project="$PROJECT_ID" \
        --location="$REGION" \
        --uniform-bucket-level-access
    
    echo "✅ Successfully created secure bucket: gs://$BUCKET_NAME"
fi

# 2. Configure CORS settings for the frontend React application
echo "🔒 Configuring CORS for frontend direct uploads (if needed)..."
cat <<EOF > cors.json
[
  {
    "origin": ["*"],
    "responseHeader": ["Content-Type", "Authorization", "x-goog-meta-*", "x-goog-acl"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update "gs://$BUCKET_NAME" --cors-file=cors.json
rm cors.json
echo "✅ CORS configuration applied."

# 3. Create initial folders (objects) for organization
echo "📂 Setting up baseline organizational directories..."
echo "Compliance Logs" > dummy.txt
gcloud storage cp dummy.txt "gs://$BUCKET_NAME/audit_logs/init.txt" >/dev/null 2>&1
gcloud storage cp dummy.txt "gs://$BUCKET_NAME/assessment_reports/init.txt" >/dev/null 2>&1
rm dummy.txt

echo "==================================================="
echo "🚀 Storage Bucket Provisioning Complete!"
echo "Bucket Name: gs://$BUCKET_NAME"
echo "You can view this bucket in the GCP Console under Cloud Storage."
echo "==================================================="
