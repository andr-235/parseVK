from pydantic import BaseModel

class SaveGroupRequest(BaseModel):
    identifier: str
