# CloudWatch monitoring and alerts
resource "aws_cloudwatch_log_group" "ec2" {
  name              = "/ec2/${var.project_name}-backend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.forecast.function_name}"
  retention_in_days = 7
}

# EC2 CPU alarm
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${var.project_name}-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "EC2 CPU > 80% for 10 minutes"

  dimensions = {
    InstanceId = aws_instance.backend.id
  }
}

# Lambda error alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Lambda function errors detected"

  dimensions = {
    FunctionName = aws_lambda_function.forecast.function_name
  }
}

# RDS connection alarm
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.project_name}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "50"
  alarm_description   = "RDS connections high"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }
}
