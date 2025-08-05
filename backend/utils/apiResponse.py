from typing import Any, Optional

class ApiResponse:
    def __init__(self, status_code: int, data: Any = None, message: str = "Success"):
        self.status_code = status_code
        self.data = data
        self.message = message
        self.success = status_code < 400

    def to_dict(self):
        return {
            "success": self.success,
            "message": self.message,
            "data": self.data
        }

class ApiError(Exception):
    def __init__(self, status_code: int, message: str = "Something went wrong"):
        self.status_code = status_code
        self.message = message
        super().__init__(self.message)