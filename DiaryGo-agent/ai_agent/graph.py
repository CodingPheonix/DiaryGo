from langgraph.graph import StateGraph, START, END

from .agent import router, task_list_generator
from .state import State

def router_logic(state: State):
    node = state["messages"][-1]
    if "task_list_generator" in node:
        return "task_list_generator"
    return "end"

graph_builder = StateGraph(State)
graph_builder.add_node("router", router)
graph_builder.add_node("task_list_generator", task_list_generator)

graph_builder.add_conditional_edges("router", router_logic, {
    "task_list_generator": "task_list_generator",
    "end": END
})

graph_builder.add_edge(START, "router")
graph_builder.add_edge("router", "task_list_generator")
graph_builder.add_edge("router", END)

graph = graph_builder.compile()


async def stream_graph_updates(user_input: str):
    response = []
    for event in graph.stream({"messages": [{"role": "user", "content": user_input}]}):
        for value in event.values():
            response.append(value["messages"][-1].content) # "Assistant:", value["messages"][-1].content
    return response