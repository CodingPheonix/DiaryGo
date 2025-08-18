import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";

import {
  task_list_generator,
  router_agent_node
} from "./agent";

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  sender: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "user",
    default: () => "user",
  }),
})

function taskRouter(state: typeof AgentState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (typeof lastMessage?.content === "string" && lastMessage.content.includes("task_list")) return "Generate_task_list";

  return "continue"; // default branch
}

// Define the workflow and add all nodes
const workflow = new StateGraph(AgentState)
  .addNode('router', router_agent_node)
  .addNode('Generate_task_list', task_list_generator)

  // Start the workflow from router
  .addEdge(START, "router")

  // Add conditional edges
  .addConditionalEdges("router", taskRouter, {
    Generate_task_list: "Generate_task_list",
    continue: "router",
    end: END,
  })

  // Add edges


  // Stop the workflow
  .addEdge("Generate_task_list", END);

export const graph = workflow.compile()

