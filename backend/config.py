from pydantic_settings import BaseSettings, SettingsConfigDict

# Loads the API key safely from the .env file

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    skyscanner_api_key: str


settings = Settings()
