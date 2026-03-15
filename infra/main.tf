# 🏗️ DoodleTales Infrastructure as Code (Terraform)
# Defines the Cloud Run service and its permissions.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The region to deploy to"
  type        = string
  default     = "europe-west2"
}

# 1. Define the Cloud Run Service
resource "google_cloud_run_service" "doodletales" {
  name     = "doodletales"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/doodletales:latest"
        ports {
          container_port = 3000
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# 2. Allow Public Access
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.doodletales.name
  location = google_cloud_run_service.doodletales.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "url" {
  value = google_cloud_run_service.doodletales.status[0].url
}
