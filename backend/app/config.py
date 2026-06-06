import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/3rike",
    )
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    bedrock_model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"
    s3_bucket: str = os.getenv("S3_BUCKET", "3rike-swap-data")
    sagemaker_endpoint: str = os.getenv("SAGEMAKER_ENDPOINT", "")
    use_bedrock: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
