#!/bin/bash

# 🚀 DoodleTales Deployment Script
# This script automates the build and deployment to AWS App Runner.

# --- Configuration ---
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
SERVICE_NAME="doodletales"
REPO_NAME="doodletales"
IMAGE_TAG="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest"

echo "------------------------------------------------"
echo "📦 Starting deployment for $SERVICE_NAME..."
echo "📍 Account: $AWS_ACCOUNT_ID"
echo "📍 Region: $REGION"
echo "------------------------------------------------"

# 1. Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION || \
aws ecr create-repository --repository-name $REPO_NAME --region $REGION

# 2. Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# 3. Build and Push Docker image
echo "🛠️  Building container image..."
docker build -t $REPO_NAME .
docker tag $REPO_NAME:latest $IMAGE_TAG
docker push $IMAGE_TAG

# 4. Deploy to App Runner (Simplified - assumes service exists or use Terraform)
echo "🚀 Deploying to AWS App Runner..."
# Note: In a real scenario, you'd use Terraform or AWS CLI to create/update the service.
# For this script, we'll just point to the new image.

echo "------------------------------------------------"
echo "✅ Image Pushed to ECR!"
echo "🔗 Image URI: $IMAGE_TAG"
echo "💡 Use Terraform in /infra to complete the App Runner deployment."
echo "------------------------------------------------"
