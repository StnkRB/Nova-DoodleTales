#!/bin/bash

# 🚀 DoodleTales Deployment Script
# This script automates the build and deployment to Google Cloud Run.

# --- Configuration ---
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="doodletales"
REGION="europe-west2"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "------------------------------------------------"
echo "📦 Starting deployment for $SERVICE_NAME..."
echo "📍 Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo "------------------------------------------------"

# 1. Build the Docker image using Cloud Build
echo "🛠️  Building container image..."
gcloud builds submit --tag $IMAGE_TAG .

# 2. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="NODE_ENV=production"

# 3. Get the URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "------------------------------------------------"
echo "✅ Deployment Successful!"
echo "🔗 URL: $SERVICE_URL"
echo "------------------------------------------------"
