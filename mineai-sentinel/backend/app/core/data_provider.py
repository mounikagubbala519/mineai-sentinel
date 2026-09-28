"""
Data Provider Abstraction Layer for MineAI Sentinel
Allows transparent switching between Synthetic Demo Data and Real Production Data from MOIL ERP/DB.
"""
from abc import ABC, abstractmethod
import os
import pandas as pd
from app.core.config import settings

class DataProvider(ABC):
    @abstractmethod
    def get_block_data(self) -> pd.DataFrame:
        pass
        
    @abstractmethod
    def get_geological_data(self) -> pd.DataFrame:
        pass
        
    @abstractmethod
    def get_production_data(self) -> pd.DataFrame:
        pass
        
    @abstractmethod
    def get_equipment_data(self) -> pd.DataFrame:
        pass
        
    @abstractmethod
    def get_environmental_data(self) -> pd.DataFrame:
        pass

class SyntheticDataProvider(DataProvider):
    def __init__(self, data_dir=None):
        self.data_dir = data_dir or settings.DATA_RAW_DIR

    def get_block_data(self) -> pd.DataFrame:
        filepath = os.path.join(self.data_dir, "block_data.csv")
        return pd.read_csv(filepath)

    def get_geological_data(self) -> pd.DataFrame:
        filepath = os.path.join(self.data_dir, "geological_data.csv")
        return pd.read_csv(filepath)

    def get_production_data(self) -> pd.DataFrame:
        filepath = os.path.join(self.data_dir, "production_data.csv")
        return pd.read_csv(filepath)

    def get_equipment_data(self) -> pd.DataFrame:
        filepath = os.path.join(self.data_dir, "equipment_data.csv")
        return pd.read_csv(filepath)

    def get_environmental_data(self) -> pd.DataFrame:
        filepath = os.path.join(self.data_dir, "environmental_data.csv")
        return pd.read_csv(filepath)

class RealDataProvider(DataProvider):
    """
    Extensible Data Provider for Real MOIL Database / API integration.
    """
    def __init__(self, connection_string=None):
        self.connection_string = connection_string

    def get_block_data(self) -> pd.DataFrame:
        raise NotImplementedError("Real MOIL database connection not configured. Using SyntheticDataProvider.")

    def get_geological_data(self) -> pd.DataFrame:
        raise NotImplementedError("Real MOIL database connection not configured. Using SyntheticDataProvider.")

    def get_production_data(self) -> pd.DataFrame:
        raise NotImplementedError("Real MOIL database connection not configured. Using SyntheticDataProvider.")

    def get_equipment_data(self) -> pd.DataFrame:
        raise NotImplementedError("Real MOIL database connection not configured. Using SyntheticDataProvider.")

    def get_environmental_data(self) -> pd.DataFrame:
        raise NotImplementedError("Real MOIL database connection not configured. Using SyntheticDataProvider.")

def get_data_provider() -> DataProvider:
    # Always default to SyntheticDataProvider for hackathon demo
    return SyntheticDataProvider()
