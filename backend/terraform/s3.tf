# S3 bucket for swap event data
resource "aws_s3_bucket" "swap_data" {
  bucket = "${var.project_name}-swap-data-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "swap_data" {
  bucket = aws_s3_bucket.swap_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "swap_data" {
  bucket                  = aws_s3_bucket.swap_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_caller_identity" "current" {}
