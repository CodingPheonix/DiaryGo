import os
import requests

from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("APPLICATION_URL")

@tool
def get_targets(userId: str):
    url = f'{url}/api/diary_for_agent?userId={userId}'
    response = requests.get(url)
    if response.status_code == 200:
        result = response.json()
        return result
    else:
        return {"message": "Cannot fetch data"}

@tool
def update_targets(diaries: list) -> dict:
    """
    Update multiple diaries by sending their modified task lists 
    to the external server.

    Args:
        diaries: A list of diary objects. Each object must contain:
                 - diary_id: str
                 - task_list: list of dicts [{ "name": str, "progress": int }, ...]

                 Example:
                 [
                    {
                        "diary_id": "123",
                        "task_list": [
                            {"name": "task1", "progress": 80},
                            {"name": "task2", "progress": 100}
                        ]
                    },
                    {
                        "diary_id": "456",
                        "task_list": [
                            {"name": "taskA", "progress": 20}
                        ]
                    }
                 ]

    Returns:
        dict: The response from the external API or error details.
    """
    url = f"{url}/diary_for_agent"

    try:
        results = []
        for diary in diaries:
                response = requests.put(url, json={
                    "diary_id": diary["diary_id"],
                    "task_list": diary["task_list"]
                })

                if response.status_code == 200:
                    results.append({
                        "diary_id": diary["diary_id"],
                        "status": "success",
                        "response": response.json()
                    })
                else:
                    results.append({
                        "diary_id": diary["diary_id"],
                        "status": "failed",
                        "code": response.status_code,
                        "details": response.text
                    })
        return {"results": results}

    except Exception as e:
        return {"error": str(e)}
