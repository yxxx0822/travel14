from typing import Dict, Any


class LocationService:
    """定位服务（模拟）"""

    @staticmethod
    def get_current_location() -> Dict[str, Any]:
        """
        获取当前位置（模拟实现）
        实际项目中可以接入真实定位API或使用前端定位
        """
        # 返回固定位置（例如学校坐标）
        return {
            "longitude": 116.404,  # 示例：北京
            "latitude": 39.915,
            "accuracy": 50,  # 精度（米）
            "method": "simulated"  # 标记为模拟数据
        }
