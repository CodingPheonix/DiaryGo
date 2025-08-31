import os
from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from ai_agent.graph import stream_graph_updates

load_dotenv()

origins=os.getenv('ORIGIN').split(',')
print(origins)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRequest(BaseModel):
    user_input: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/getorigin")
def getorigin():
    return {f"origins:{origins}"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.post("/graph")
async def call_graph(user_input: UserRequest):
    response = await stream_graph_updates(user_input.user_input)
    return {"responses": response}
