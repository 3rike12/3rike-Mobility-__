# RDS PostgreSQL instance
resource "aws_db_subnet_group" "main" {
  name       = "app-${var.project_name}-db-subnet-group"
  subnet_ids = data.aws_subnets.public.ids
}

resource "aws_db_instance" "postgres" {
  identifier             = "app-${var.project_name}-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "swap_db"
  username               = "postgres"
  password               = var.db_password
  skip_final_snapshot    = true
  publicly_accessible    = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  backup_retention_period = 1
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL from EC2"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ec2" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.ec2.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_lambda" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.lambda.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
