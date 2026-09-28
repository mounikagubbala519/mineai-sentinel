"""
Configuration settings for MineAI Sentinel Backend
"""
import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

def _resolve_paths():
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    # Try 3 levels up first (root of repository)
    base_dir = os.path.abspath(os.path.join(curr_dir, "../../.."))
    data_raw_dir = os.path.join(base_dir, "data/raw")
    saved_models_dir = os.path.join(base_dir, "backend/ml/saved_models")

    # Fallback resolution if started from backend subdirectory
    if not os.path.exists(data_raw_dir):
        alt_data = os.path.abspath(os.path.join(curr_dir, "../../data/raw"))
        if os.path.exists(alt_data):
            data_raw_dir = alt_data

    if not os.path.exists(saved_models_dir):
        alt_models = os.path.abspath(os.path.join(curr_dir, "../../ml/saved_models"))
        if os.path.exists(alt_models):
            saved_models_dir = alt_models

    return base_dir, data_raw_dir, saved_models_dir

_base_dir, _data_raw_dir, _saved_models_dir = _resolve_paths()

class Settings(BaseSettings):
    PROJECT_NAME: str = "MineAI Sentinel"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DEMO_MODE: bool = True
    
    # Path configuration
    BASE_DIR: str = _base_dir
    DATA_RAW_DIR: str = _data_raw_dir
    SAVED_MODELS_DIR: str = _saved_models_dir
    
    # CORS setup
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    class Config:
        case_sensitive = True

settings = Settings()

