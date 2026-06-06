variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "3rike-mobility"
}

variable "db_password" {
  description = "RDS PostgreSQL password"
  sensitive   = true
}


variable "bedrock_model_id" {
  description = "Bedrock model ID for forecasting"
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  default     = "0.0.0.0/0"
}
