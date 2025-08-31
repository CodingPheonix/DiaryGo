import os
import json
import requests
from pydantic import BaseModel
from typing import List
from pathlib import Path

from langchain_core.tools import tool
from langchain_core.messages import ToolMessage
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("APPLICATION_URL")

class Task(BaseModel):
    name: str
    progress: int

class Target(BaseModel):
    name: str
    progress: int

class Diary(BaseModel):
    diary_id: str
    target: Target
    task_list: List[Task]

class UpdateTargetsInput(BaseModel):
    diaries: List[Diary]

@tool
def get_targets(userId: str):
    """
        This tool helps to get all targets from database, with the userId.
        It takes the userId as an argument
        Calls an api to the database and fetches the diary details.
    """
    url = f'{url}/api/diary_for_agent?userId={userId}'
    response = requests.get(url)
    if response.status_code == 200:
        result = response.json()
        return result
    else:
        return {"message": "Cannot fetch data"}

@tool(args_schema=UpdateTargetsInput)
def update_targets(diaries: List[Diary]) -> dict:
    """
    Update multiple diaries by sending their modified task lists 
    to the external server.
    """
    url = f"{url}/api/diary_for_agent"

    try:
        results = []
        for diary in diaries:
            response = requests.put(url, json={
                "diary_id": diary.diary_id,
                "target": diary.target.model_dump(),
                "task_list": [task.model_dump() for task in diary.task_list]
            })

            if response.status_code == 200:
                results.append({
                    "diary_id": diary.diary_id,
                    "status": "success",
                    "response": response.json()
                })
            else:
                results.append({
                    "diary_id": diary.diary_id,
                    "status": "failed",
                    "code": response.status_code,
                    "details": response.text
                })
        return {"results": results}

    except Exception as e:
        return {"error": str(e)}