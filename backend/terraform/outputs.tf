output "backend_url" {
  description = "FastAPI backend URL"
  value       = "http://${aws_eip.backend.public_ip}:8000"
}

output "api_endpoints" {
  description = "Available API endpoints"
  value = {
    health    = "http://${aws_eip.backend.public_ip}:8000/health"
    stations  = "http://${aws_eip.backend.public_ip}:8000/stations"
    docs      = "http://${aws_eip.backend.public_ip}:8000/docs"
    rebalance = "http://${aws_eip.backend.public_ip}:8000/rebalance"
  }
}

output "s3_bucket" {
  description = "S3 bucket for swap data"
  value       = aws_s3_bucket.swap_data.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
}

output "lambda_function" {
  description = "Forecast Lambda function name"
  value       = aws_lambda_function.forecast.function_name
}

output "db_connection" {
  description = "Database connection string (without password)"
  value       = "postgresql://postgres:<password>@${aws_db_instance.postgres.address}:5432/swap_db"
  sensitive   = true
}
