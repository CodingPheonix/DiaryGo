import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { END, START, StateGraph } from "@langchain/langgraph";

import { classify, makeTaskList, router_agent_node, task_list_generator_node } from "./agent";

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  sender: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "user",
    default: () => "user",
  }),
})

function router(state: typeof AgentState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    // The previous agent is invoking a tool
    return "call_tool";
  }

  if (typeof lastMessage?.content === "string" && lastMessage.content.includes("task_list_generator")) {
    return 'task_list_generator'
  };

  if (typeof lastMessage.content === "string" && lastMessage.content.includes("FINAL ANSWER")) {
    // Any agent decided the work is done
    return "end";
  }
  return "continue"; // default branch
}

// Define tool node
const tools = [makeTaskList, classify];
const toolNode = new ToolNode<typeof AgentState.State>(tools);

// Define the workflow and add all nodes
const workflow = new StateGraph(AgentState)
  .addNode('researcher', router_agent_node)
  .addNode('task_list_generator', task_list_generator_node)
  .addNode('call_tool', toolNode)

  // Start the workflow from researcher
  .addEdge(START, "researcher")

  // Add conditional edges
  .addConditionalEdges("researcher", router, {
    task_list_generator: "task_list_generator",
    continue: "researcher",
    call_tool: "call_tool",
    end: END,
  })

  .addConditionalEdges(
    "call_tool",
    (x) => x.sender,
    {
      researcher: "researcher",
      task_list_generator: "task_list_generator",
    },
  )

  // Add edges
  // for complicated tasks later

  // Stop the workflow
  .addEdge("task_list_generator", END);

export const graph = workflow.compile()

