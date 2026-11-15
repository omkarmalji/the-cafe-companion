import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "The Café Companion"
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "the-cafe-companion")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("STITCH_GOOGLE_API_KEY") or ""
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cafe.db")
    PORT: int = int(os.getenv("PORT", "8080"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    CORS_ORIGINS: List[str] = ["*"]
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
