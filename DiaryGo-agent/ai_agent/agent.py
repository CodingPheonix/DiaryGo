import os
import json
from langchain.chat_models import init_chat_model
from langgraph.prebuilt import ToolNode
from langchain_core.messages import ToolMessage, AIMessage
from dotenv import load_dotenv

from .state import State
from .tools import get_targets, update_targets

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

llm = init_chat_model("google_genai:gemini-2.0-flash")
tool_mapping = {"get_targets": get_targets, "update_targets": update_targets}

tools = [get_targets, update_targets]
tool_node = ToolNode(tools)
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

def router(state: State):
    prompt = f"""
        You are an expert routing agent.
        Your job is to READ the user input and RETURN the name of the node that is best suited to handle the request.

        Available Nodes:
        - task_list_generator - Used to generate a task list - Example: "I want to create a task list."
        - update_progress - Used to update the progress of tasks - Example: "I want to update the progress of my tasks."
        - end

        Generate only the name of the node, nothing else.

        Example 1: 
        input : "I want to create a task list. task list is: Buy milk, Walk the dog"
        output : "task_list_generator"

        Example 2:
        input : "I want to update the progress of my tasks. Here are some documents: Achievement: i have read for 30 min, userId: 123456789"
        output: "update_progress"

        User input is: {state["messages"][-1].content}
    """
    return {"messages": [llm.invoke(prompt)]}

def task_list_generator(state: State):
    prompt = f"""
        You are an expert in extracting and structuring tasks from unorganized text.  
        Your job is to TAKE, UNDERSTAND, SEPARATE, and RETURN the input text as a clean, concise list of actionable tasks.  

        ### Guidelines:
        - Take the input text (a lump of unstructured sentences).  
        - Understand the intent behind each phrase or clause.  
        - Separate them into distinct, do-able action items.  
        - Return the final result as a list of short, clear task statements.  
        - Remove redundancy.  
        - Use proper capitalization.  
        - Keep tasks simple and actionable.  

        ### Important:
        - The following examples are ONLY for illustration.  
        - Do **not** copy or reuse them.  
        - Always base your output ONLY on the actual input text provided after "Input text:".  

        ### Examples (for reference only):
        Example 1  
        Input: "I will have to brush my teeth, wash my face, and take a shower followed by I will also have to eat breakfast and lunch. i also have to do my homework and study for my exam and walk my dog."  
        Output: ["Brush my teeth", "Wash my face", "Take a shower", "Eat breakfast and lunch", "Do homework", "Study for exam", "Walk my dog"]

        Example 2  
        Input: "Tomorrow I need to buy groceries, call mom, finish my office report, clean the kitchen, and schedule a doctor’s appointment. Later, I should also water the plants and prepare dinner."  
        Output: ["Buy groceries", "Call mom", "Finish office report", "Clean the kitchen", "Schedule doctor’s appointment", "Water the plants", "Prepare dinner"]

        ---

        ### Input text: {state["messages"]}

        ### Output (list of tasks):

    """
    return {"messages": [llm.invoke(prompt)]}

def progress_updator(state: State):
    prompt = """
        You are an expert in tracking progress on tasks.
        Your job consists of 5 steps :
        1. Read the input achievement from the user.
        2. Read all the target details recieved from other agents
        3. Precisely, go through each targets, find related targets matching the achievement.
        4. Calculate a rough percentage of completion for each task.
        5. MAKE sure to add the word "progressUpdated" in return. IMPORTANT
        5. Generate a report on updated progresses in the format:
            [
                {
                    "diary_id": "123",
                    "target": {
                        "name" : "target1",
                        "progress" : 40
                    }
                    "task_list": [
                        {"name": "task1", "progress": 80},
                        {"name": "task2", "progress": 100}
                    ]
                },
                {
                    "diary_id": "456",
                    "target": {
                        "name" : "targetA",
                        "progress" : 20
                    }
                    "task_list": [
                        {"name": "taskA", "progress": 20}
                    ]
                }
            ]

        ### Important:
        - The following examples are ONLY for illustration.  
        - Do **not** copy or reuse them.  
        - Always base your output ONLY on the actual input text provided after "Input text:".  

        Example 1:
        input : "
            I have completed the following tasks: I woke up at 6am today
        "
        fetched data: [
                        {
                            "_id": "68ab05fcabf3ed485bd287be",
                            "userId": "68a1c65412e11e994c2dfbcf",
                            "target": {
                                "name": "make a habit to wake up early",
                                "progress": 0,
                                "_id": "68ab05fcabf3ed485bd287bf"
                            },
                            "task_list": [
                                {
                                    "name": "Wake up at 6am",
                                    "progress": 0,
                                    "_id": "68ab05fcabf3ed485bd287c0"
                                },
                                {
                                    "name": "Wake up at 5am",
                                    "progress": 0,
                                    "_id": "68ab05fcabf3ed485bd287c1"
                                },
                                {
                                    "name": "Wake up at 4am",
                                    "progress": 0,
                                    "_id": "68ab05fcabf3ed485bd287c2"
                                }
                            ],
                            "target_achieved": false,
                            "__v": 0,
                            "diary_id": "68ab05fcabf3ed485bd287be"
                        }
                    ]
        output : ProgressUpdated. 
            [
                {
                    "diary_id": "68ab05fcabf3ed485bd287be",
                    "target": {
                        "name" : "make a habit to wake up early",
                        "progress" : 33
                    },
                    "task_list": [
                            {
                                "name": "Wake up at 6am",
                                "progress": 100,
                            },
                            {
                                "name": "Wake up at 5am",
                                "progress": 0,
                            },
                            {
                                "name": "Wake up at 4am",
                                "progress": 0,
                            }
                    ],
                }
            ]
    """ + f"User input is: {state["messages"]}"

    return {"messages": [llm.invoke(prompt)]}

def database_manager(state: State):
    prompt = """
        You are an expert Database Manager AI.  
        You can perform two main actions using tools:  
        1. Fetching targets  
        2. Updating targets  
        You will only use one at a time

        Available Tools:  
        - get_targets("userId") → retrieves targets for a given userId.  
        - Always include the key "fetchedTargets" in your response when using this tool.  
        - update_targets(diaries: ["diary_id", "target", "task_list"]) → updates targets and their task lists.  
        - Always include the key "UpdatedTargets" in your response when using this tool. 

        Decision:
            If I have userId and achievement - use get_targets(userId) 
            if i have diary_id and task list - use update_targets

        Instructions:  
        - For continuing agentic workflow:
         - If you use  get_targets: MUST INCLUDE "fetchedTargets" in response text
         - If you use  update_targets: MUST INCLUDE "UpdatedTargets" in response text

        - For fetching targets:  
        • The userId will be provided in earlier messages.  
        • Call the get_targets tool with this userId.  
        • Return the fetched JSON with the key "fetchedTargets".  

        - For updating targets:  
        • You will be given an array of diary objects in this format:  
            [
                {
                    "diary_id": "123",
                    "target": {
                        "name": "target1",
                        "progress": 40
                    },
                    "task_list": [
                        {"name": "task1", "progress": 80},
                        {"name": "task2", "progress": 100}
                    ]
                }
            ]  
        • Pass the entire array as the 'diaries' argument (consisting of diary_id, target and task_list) to update_targets.  
        • Return the tool output with the key "UpdatedTargets".  

        ### Important:
        Always reason step by step, pick the correct tool based on the request, and ensure your response includes either "fetchedTargets" or "UpdatedTargets".  
    """ + f"\nState messages: {state['messages']}"

    llm_output = llm_with_tools.invoke(prompt)
    tool_message = None
    tool_used = ""

    # process any tool calls
    for tool_call in getattr(llm_output, "tool_calls", []):
        tool_name = tool_call["name"].lower()
        tool = tool_mapping.get(tool_name)

        if tool:
            tool_used = tool_name
            tool_result = tool.invoke(tool_call["args"])
            tool_message = ToolMessage(tool_result, tool_call_id=tool_call["id"])

    # ask LLM again with updated context (messages + tool results)
    if tool_used == "get_targets":
        final_response = {
            "fetchedTargets": tool_result  # keep raw JSON/dict
        }
    else:
        final_response = {
            "UpdatedTargets": tool_result
        }

    # return as stringified JSON so it's valid
    return {"messages": [AIMessage(content=json.dumps(final_response))]}
