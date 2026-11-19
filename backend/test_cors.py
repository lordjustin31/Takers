import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / '.env'

print(f"Looking for .env at: {env_path}")
print(f".env exists: {env_path.exists()}")

load_dotenv(env_path)

cors_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "NOT SET")
print(f"\nCORS_ALLOWED_ORIGINS from environment:")
print(cors_origins)
print(f"\nSplit into list:")
for origin in cors_origins.split(","):
    print(f"  - {origin.strip()}")
