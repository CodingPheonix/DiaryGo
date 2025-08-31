import os
from dotenv import load_dotenv

from langgraph.graph import StateGraph, START, END

from .agent import router, task_list_generator, progress_updator, database_manager
from .state import State
from .agent import tool_node

load_dotenv()

def router_logic(state: State):
    node = state["messages"][-1].content.strip().lower()
    if "task_list_generator" in node:
        return "task_list_generator"
    if "update_progress" in node:
        return "database_manager"
    return "end"

def db_logic(state: State):
    last_message = state["messages"][-1].content
    if "I'm ready to receive instructions for fetching and updating targets" in last_message:
        return "tools"
    if "fetchedTargets" in last_message:   # after fetching
        return "progress_updator"
    if "UpdatedTargets" in last_message:   # after updating
        return "end"
    return "router"  # fallback

graph_builder = StateGraph(State)
graph_builder.add_node("router", router)
graph_builder.add_node("task_list_generator", task_list_generator)
graph_builder.add_node("progress_updator", progress_updator)
graph_builder.add_node("database_manager", database_manager)
graph_builder.add_node("tools", tool_node)

graph_builder.add_edge(START, "router")

graph_builder.add_conditional_edges("router", router_logic, {
    "task_list_generator": "task_list_generator",
    "database_manager": "database_manager",
    "end": END
})

graph_builder.add_conditional_edges("database_manager", db_logic, {
    "tools": "tools",
    "progress_updator": "progress_updator",
    "end": END,
    "router": "router"
})

graph_builder.add_edge("progress_updator", "database_manager")
graph_builder.add_edge("task_list_generator", END)

graph = graph_builder.compile()

print("graph: " , graph)


async def stream_graph_updates(user_input: str):
    response = []
    for event in graph.stream({"messages": [{"role": "user", "content": user_input}]}):
        for value in event.values():
            if "messages" in value and value["messages"]:
                response.append(value["messages"][-1].content if hasattr(value["messages"][-1], "content") else value["messages"][-1])
            else:
                print(f"⚠️ Node returned no messages -> {value}")
    return response