# 🏗️ DoodleTales Infrastructure as Code (Terraform)
# Defines the AWS App Runner service and its permissions.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "image_uri" {
  description = "The ECR image URI"
  type        = string
}

# 1. Define the App Runner Service
resource "aws_apprunner_service" "doodletales" {
  service_name = "doodletales"

  source_configuration {
    image_repository {
      image_identifier      = var.image_uri
      image_repository_type = "ECR"
      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV = "production"
        }
      }
    }
    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu    = "1024"
    memory = "2048"
  }

  tags = {
    Name = "DoodleTales"
  }
}

output "service_url" {
  value = aws_apprunner_service.doodletales.service_url
}
