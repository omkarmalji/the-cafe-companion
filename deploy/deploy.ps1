# ==========================================
# Deploy The Café Companion to Google Cloud Run (PowerShell)
# Region: asia-south1 (Mumbai, India)
# ==========================================

$SERVICE_NAME = "the-cafe-companion"
$REGION = "asia-south1"
$PROJECT_ID = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "the-cafe-companion" }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Deploying $SERVICE_NAME to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Region: $REGION (Mumbai, India)" -ForegroundColor Cyan
Write-Host " Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Set active GCP project
gcloud config set project $PROJECT_ID

# Enable APIs
Write-Host "Enabling Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com generativelanguage.googleapis.com

# Deploy from source
Write-Host "Building and deploying to Cloud Run in $REGION..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
  --source . `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,GEMINI_API_KEY=$env:GEMINI_API_KEY"

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
Write-Host "==========================================" -ForegroundColor Green
