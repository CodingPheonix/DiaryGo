import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { classification_tool, createTaskList } from "./tools";
import { StructuredTool } from "@langchain/core/tools";
import { Runnable } from "@langchain/core/runnables";

// INITIALISE GEMINI LLM
export const gemini = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash',
    temperature: 0.2
})

// List of tool Initialisation
const makeTaskList = new createTaskList()
const classify = new classification_tool()

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

export const task_list_generator = await createAgent({
    llm: gemini,
    tools: [makeTaskList],
    systemMessage: "Generate an array of tasks from a lump of text",
})

export const router_agent_node = await createAgent({
    llm: gemini,
    tools: [classify],
    systemMessage: `
        Your job is to classify the user's intent based on their message.
        Use the tool classify to determine the next agent to use
    `
})