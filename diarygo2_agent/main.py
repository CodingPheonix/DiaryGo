import os
from dotenv import load_dotenv
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from workflow.agent import supervisor_agent
from workflow.tools import get_targets, create_target, Task, update_targets, Diary, Target

app = FastAPI()
load_dotenv()

origins = os.getenv('FRONTEND_URL').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class createTarget(BaseModel):
    userid: str
    target: str
    task_list: List[Task]

class updateTargets(BaseModel):
    id: str
    target: Target
    task_list: List[Task]

class AgentRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.get("/targets/{userId}")
def getTargets(userId: str):
    return get_targets(userId)

@app.post("/targets")
def postTarget(input: createTarget):
    return create_target(input.userid, input.target, input.task_list)

@app.put("/targets")
def putTarget(input: List[updateTargets]):
    return update_targets(input)

@app.post("/agent")
def agent(input: AgentRequest):
    result = []

    for step in supervisor_agent.stream(
            {"messages": [{"role": "user", "content": input.query}]}
    ):
        for update in step.values():
            for message in update.get("messages", []):
                result.append(message)

    return result