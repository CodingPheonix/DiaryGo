import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { classification_tool, createTaskList } from "./tools";
import { StructuredTool } from "@langchain/core/tools";
import { Runnable } from "@langchain/core/runnables";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { AgentState } from './graph';

// INITIALISE GEMINI LLM
export const gemini = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash',
    temperature: 0.2
})

// List of tool Initialisation
export const makeTaskList = new createTaskList()
export const classify = new classification_tool()

// FUNCTION TO CREATE AGENTS 
async function createAgent({
    llm,
    tools,
    systemMessage,
}: {
    llm: ChatGoogleGenerativeAI;
    tools: StructuredTool[];
    systemMessage: string;
}): Promise<Runnable> {
    const toolNames = tools.map((tool) => tool.name).join(", ");

    let prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "You are a helpful AI assistant, collaborating with other assistants." +
            " Use the provided tools to progress towards answering the question." +
            " If you are unable to fully answer, that's OK, another assistant with different tools " +
            " will help where you left off. Execute what you can to make progress." +
            " If you or any of the other assistants have the final answer or deliverable," +
            " prefix your response with FINAL ANSWER so the team knows to stop." +
            " You have access to the following tools: {tool_names}.\n{system_message}",
        ],
        new MessagesPlaceholder("messages"),
    ]);
    prompt = await prompt.partial({
        system_message: systemMessage,
        tool_names: toolNames,
    });

    return prompt.pipe(llm.bind({ tools: tools }));
}

// Helper function for running agent node
async function runAgentNode(props: {
    state: typeof AgentState.State;
    agent: Runnable;
    name: string;
    config?: RunnableConfig;
}) {
    const { state, agent, name, config } = props;
    let result = await agent.invoke(state, config);
    if (!result?.tool_calls || result.tool_calls.length === 0) {
        // result = new AIMessage({ ...result, name: name });
        result.name = name;
    }
    return {
        messages: [result],
        sender: name,
    };
}

// task list generator
export const task_list_generator = await createAgent({
    llm: gemini,
    tools: [makeTaskList],
    systemMessage: "Generate an array of tasks from a lump of text",
})

// helper function for task list generator
export async function task_list_generator_node(state: typeof AgentState.State) {
    return runAgentNode({
        state: state,
        agent: task_list_generator,
        name: "task_list_generator",
    });
}

// router agent 
export const router_agent = await createAgent({
    llm: gemini,
    tools: [classify],
    systemMessage: `
        Your job is to classify the user's intent based on their message.
        Use the tool classify to determine the next agent to use.
        You are a router. You must ONLY output one of:
        - "call_tool"
        - "task_list_generator"
        - "continue"
        - "end"
    `
})

// helper function for router agent
export async function router_agent_node(
    state: typeof AgentState.State,
    config?: RunnableConfig,
) {
    return runAgentNode({
        state: state,
        agent: router_agent,
        name: "router_agent",
        config,
    });
}