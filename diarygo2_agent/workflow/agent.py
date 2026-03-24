import os
from typing import List

from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import Field, BaseModel

from workflow.tools import get_targets, update_targets, create_target

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv('GOOGLE_API_KEY')
print(os.getenv('GOOGLE_API_KEY'))

os.environ['LANGSMITH_TRACING'] = os.getenv("LANGSMITH_TRACING")
os.environ['LANGSMITH_API_KEY'] = os.getenv("LANGSMITH_API_KEY")
os.environ['LANGSMITH_PROJECT'] = os.getenv("LANGSMITH_PROJECT")

model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview")

TASK_GENERATOR_AGENT_PROMPT = (
    "You are a task generating assistant. "
    "Parse natural language task generating requests (e.g., 'I want to create discipline by taking a bath and having breakfast before going to school') "
    "into proper string array formats. (e.g., target -> 'Create Discipline' task_list -> ['eat breakfast', 'take a shower', 'go to school'])"
    "Use create_target to create a new task inside db. "
    "Always confirm what was scheduled in your final response."
)

class TaskList(BaseModel):
    list: List[str] = Field(description="List of tasks to create")

task_generator_agent = create_agent(
    model,
    tools=[create_target],
    system_prompt=TASK_GENERATOR_AGENT_PROMPT,
    response_format=TaskList
)

# DATABASE MANAGER AGENT TO GET AND UPDATE TARGETS
DATABASE_MANAGER_PROMPT = (
    "You are a database managing assistant. "
    "Take criteria and the task, call the appropriate function, verify the requirements to perform the task "
    "Use get_targets to get all targets. "
    "Use update_targets to update targets. "
    "When you update targets, first take all targets, look at the current modifications, filter out the appropriate targets, adjust the progress of each section accordingly, create the updated data, and update the new data in database."
    "You will always calculate the update progress on a percentage basis. 100 -> completed; 0 -> not started (e.g., i have completed a task or i have achieved something completely, progress: 100.)"
    "Progress of the target will be an average of the progress of its tasks"
    "Return whatever tool you used. "
)

class TaskResult(BaseModel):
    ans: str = Field(description="Name of tool used and task performed")

database_manager_agent = create_agent(
    model,
    tools=[get_targets, update_targets],
    system_prompt=DATABASE_MANAGER_PROMPT,
    response_format=TaskResult
)

# WRAPPING TASK LIST GENERATOR AS A TOOL
@tool
def create_new_target(request: str) -> str:
    """Create Target and list of tasks, also note the userId from natural language

    Use this when user wants to create new Target, add new targets and task lists to db.
    Create a list of tasks and identifies Target from natural language

    Input: Natural language request (e.g., 'I want to create a new target, my id is: . my aim is .')
    """
    result = task_generator_agent.invoke({
        "messages": [{"role": "user", "content": request}]
    })
    return result["messages"][-1].text


# WRAPPING DATABASE MANAGER AS A TOOL
@tool
def maintain_database(request: str) -> str:
    """Fetches and updates targets, task list and their progress

    Use this when user wants to modify the task progress.
    It takes data as natural language, fetches all appropriate targets, compares the input data with fetched targets and tasks, Updates progress for appropriate and related tasks and targets, finally updates the database with new data.

    Input: Natural language request (e.g., 'Update my progress. my id is:  . my achievement is .')
    """
    result = database_manager_agent.invoke({
        "messages": [{"role": "user", "content": request}]
    })
    return result["messages"][-1].text

# CREATE THE SUPERVISOR AGENT
SUPERVISOR_PROMPT = (
    "You are a helpful personal assistant. "
    "You can either create new target events or update progress of current targets and make database changes"
    "User query will include wheather to create targets or update progress"
    "At a time only one task can be performed: creating new target or updating progress of current targets"
    "When a request involves multiple actions, use multiple tools in sequence."
    "Finally, respond a json of status and status message"
)

# class SupervisorResponse(BaseModel):
#     status: int = Field(description="Status of the request")
#     message: str = Field(description="Message of the request")

supervisor_agent = create_agent(
    model,
    tools=[create_new_target, maintain_database],
    system_prompt=SUPERVISOR_PROMPT,
)