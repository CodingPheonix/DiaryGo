import os
from typing import List, Any

from bson import ObjectId
from pydantic import BaseModel
from langchain.tools import tool
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

url = os.getenv("FRONTEND_URL")
mongoUrl = os.getenv("MONGO_URL")

client = MongoClient(mongoUrl)
database = client["test"]
diary = database["diaries"]


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

class GetTargetsInput(BaseModel):
    userId: str

class UpdateTargets(BaseModel):
    id: str
    target: Target
    task_list: List[Task]

class UpdateTargetsInput(BaseModel):
    inputs: List[UpdateTargets]

class InsertTargets(BaseModel):
    userId: str
    target: str
    task_list: List[Task]

@tool(args_schema=GetTargetsInput)
def get_targets(userId: str) -> list[Any] | dict[str, str] | Any:
    """
       This tool helps to get all targets from database, with the userId as argument.
       Each target contain id, target (name, progress) and task_list ([{name, progress}])
   """
    try:
        result = []
        target_diary = diary.find({"userId": userId})
        for oneDiary in target_diary:
            print(oneDiary)
            all_targets = {"id": str(oneDiary["_id"]), "target": oneDiary["target"], "task_list": oneDiary["task_list"]}
            result.append(all_targets)
        return result
    except Exception as e:
        return {"error": str(e)}

@tool(args_schema=UpdateTargetsInput)
def update_targets(inputs: UpdateTargetsInput) -> dict:
    """
    Update multiple targets using their document _id
    """
    try:
        results = []

        for item in inputs:
            query_filter = {
                "_id": ObjectId(item.id)   # ✅ match by document ID
            }

            update_operation = {
                "$set": {
                    "target": item.target.model_dump(),  # ✅ update full target
                    "task_list": [
                        task.model_dump() for task in item.task_list
                    ]
                }
            }

            result = diary.update_one(query_filter, update_operation)

            results.append({
                "id": item.id,
                "matched": result.matched_count,
                "modified": result.modified_count
            })

        return {"status": "success", "updates": results}

    except Exception as e:
        return {"error": str(e)}


@tool(args_schema=InsertTargets)
def create_target(userId: str, target: str, task_list: List[Task]):
    """
    takes userId, target and a list of task_list to create the target in database
    """
    try:
        result = diary.insert_one({
            "userId": userId,
            "target": {"name": target, "progress": 0},
            "task_list": [task.model_dump() for task in task_list],
        })
        return {"inserted_id": str(result.inserted_id)}

    except Exception as e:
        return {"error": str(e)}
