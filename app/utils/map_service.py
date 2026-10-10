import requests
import os
from typing import Optional, Dict, Any


class MapService:
    """高德地图服务封装"""

    def __init__(self):
        self.api_key = os.getenv("AMAP_WEB_SERVICE_KEY")
        self.base_url = "https://restapi.amap.com/v3"

    def geocode(self, address: str) -> Optional[Dict[str, Any]]:
        """地理编码：地址 -> 经纬度"""
        url = f"{self.base_url}/geocode/geo"
        params = {
            "key": self.api_key,
            "address": address
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            data = response.json()

            if data["status"] == "1" and data["geocodes"]:
                location = data["geocodes"][0]["location"].split(",")
                return {
                    "longitude": float(location[0]),
                    "latitude": float(location[1]),
                    "formatted_address": data["geocodes"][0].get("formatted_address", address)
                }
        except Exception as e:
            print(f"Geocode error: {e}")

        return None

    def reverse_geocode(self, longitude: float, latitude: float) -> Optional[Dict[str, Any]]:
        """逆地理编码：经纬度 -> 地址"""
        url = f"{self.base_url}/geocode/regeo"
        params = {
            "key": self.api_key,
            "location": f"{longitude},{latitude}"
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            data = response.json()

            if data["status"] == "1" and data.get("regeocode"):
                regeocode = data["regeocode"]
                return {
                    "address": regeocode.get("formatted_address", ""),
                    "province": regeocode["addressComponent"].get("province", ""),
                    "city": regeocode["addressComponent"].get("city", ""),
                    "district": regeocode["addressComponent"].get("district", "")
                }
        except Exception as e:
            print(f"Reverse geocode error: {e}")

        return None

    def calculate_distance(self, loc1: tuple, loc2: tuple) -> Optional[float]:
        """计算两点距离（米）"""
        url = f"{self.base_url}/distance"
        params = {
            "key": self.api_key,
            "origins": f"{loc1[0]},{loc1[1]}",
            "destination": f"{loc2[0]},{loc2[1]}"
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            data = response.json()

            if data["status"] == "1" and data["results"]:
                return float(data["results"][0]["distance"])
        except Exception as e:
            print(f"Distance calculation error: {e}")

        return None
