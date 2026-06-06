```eraser-diagram
[AWS Cloud] {
  [VPC] {
    [EC2: FastAPI Backend] : Runs on t3.micro, serves all 14 endpoints
    [RDS: PostgreSQL] : db.t3.micro, stores all data
    [EC2: FastAPI Backend] --> [RDS: PostgreSQL] : SQLAlchemy
  }

  [Lambda: Forecast Engine] : Triggered every 30 min by EventBridge
  [Lambda: Forecast Engine] --> [Bedrock: Claude Haiku] : AI predictions
  [Lambda: Forecast Engine] --> [RDS: PostgreSQL] : Writes predictions
  [Lambda: Forecast Engine] --> [S3: Swap Data] : Read/Write CSV

  [CloudWatch: Monitoring] : Alarms & logs
  [CloudWatch: Monitoring] --- [EC2: FastAPI Backend]
  [CloudWatch: Monitoring] --- [Lambda: Forecast Engine]
}

[User: Next.js Frontend] : App Router, React 19
[User: Next.js Frontend] --> [EC2: FastAPI Backend] : HTTP / REST API
```

---

**Deployment:**

```eraser-diagram
[GitHub] --> [GitHub Actions] : Push to main
[GitHub Actions] --> [EC2: FastAPI Backend] : SSM + git pull + restart
[GitHub Actions] --> [Terraform] : IaC provisioning
[Terraform] --> [AWS Cloud] : RDS / Lambda / S3 / Security Groups
```
