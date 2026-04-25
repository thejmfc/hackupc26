from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    skyscanner_api_key: str
    skyscanner_api_host: str = "sky-scrapper.p.rapidapi.com"


settings = Settings()
