#!/bin/bash
set -e

# ==========================================
# Deploy The Café Companion to Google Cloud Run
# Region: asia-south1 (Mumbai, India)
# ==========================================

SERVICE_NAME="the-cafe-companion"
REGION="asia-south1"
PROJECT_ID="${GCP_PROJECT_ID:-the-cafe-companion}"

echo "=========================================="
echo " Deploying ${SERVICE_NAME} to Cloud Run"
echo " Region: ${REGION} (Mumbai, India)"
echo " Project: ${PROJECT_ID}"
echo "=========================================="

# Ensure project is set
gcloud config set project "${PROJECT_ID}"

# Enable necessary Google Cloud APIs
echo "Enabling required APIs (Cloud Run, Artifact Registry, Gemini)..."
gcloud services enable run.googleapis.com \
                       artifactregistry.googleapis.com \
                       cloudbuild.googleapis.com \
                       generativelanguage.googleapis.com

# Deploy container directly from source to Cloud Run
echo "Building container and deploying to Cloud Run in ${REGION}..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GEMINI_API_KEY=${GEMINI_API_KEY}"

echo "=========================================="
echo " Deployment Complete!"
echo " Service URL:"
gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)'
echo "=========================================="
