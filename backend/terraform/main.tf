terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = local.common_tags
  }
}

locals {
  common_tags = {
    Project     = var.project_name
    Environment = "hackathon"
    ManagedBy   = "terraform"
    "aws-apn-id" = "pc:8l8gcn23lmlgammd8572tk6va"
    event       = "oneWithAI"
  }
}
