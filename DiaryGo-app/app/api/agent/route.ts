import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { diary } from "../mongo/mongo_schema";
import { connect_to_mongo } from "../mongo/connect_to_mongo";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// Initialize Gemini
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

// Tools
const getTargetsTool = tool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ userId }: any) => {
    await connect_to_mongo();
    const all_diaries = await diary.find({ userId: userId });
    if (!all_diaries) return JSON.stringify({ message: "Cannot fetch data" });
    const target_diaries = all_diaries.filter((d) => d.target_achieved === false);
    const modified_diaries = target_diaries.map((d) => ({
      ...d.toObject(),
      diary_id: d._id,
    }));
    return JSON.stringify(modified_diaries);
  },
  {
    name: "get_targets",
    description: "Helps to get all targets from database, with the userId.",
    schema: z.object({
      userId: z.string(),
    }),
  }
);

const updateTargetsTool = tool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ diaries }: any) => {
    await connect_to_mongo();
    const results = [];
    for (const d of diaries) {
      const updated = await diary.findByIdAndUpdate(
        d.diary_id,
        { target: d.target, task_list: d.task_list },
        { new: true }
      );
      results.push(updated);
    }
    return JSON.stringify({ message: "Successfully updated", data: results });
  },
  {
    name: "update_targets",
    description: "Update multiple diaries by sending their modified task lists.",
    schema: z.object({
      diaries: z.array(
        z.object({
          diary_id: z.string(),
          target: z.any(),
          task_list: z.any(),
        })
      ),
    }),
  }
);

const tools = [getTargetsTool, updateTargetsTool];
const llmWithTools = llm.bindTools(tools);

// Graph State
const GraphState = Annotation.Root({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// Nodes
const routerNode = async (state: typeof GraphState.State) => {
  const prompt = `
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

        User input is: ${state.messages[state.messages.length - 1].content}
    `;
  const response = await llm.invoke(prompt);
  return { messages: [response] };
};

const taskListGeneratorNode = async (state: typeof GraphState.State) => {
  const prompt = `
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

        ### Input text: ${state.messages.map((m) => m.content).join("\n")}

        ### Output (list of tasks):
    `;
  const taskSchema = z.object({
    tasks: z.array(z.string()).describe("List of simple and actionable tasks extracted from the text.")
  });
  const structuredLlm = llm.withStructuredOutput(taskSchema, { name: "extract_tasks" });
  const response = await structuredLlm.invoke(prompt);
  return { messages: [new AIMessage(JSON.stringify(response.tasks))] };
};

const progressUpdatorNode = async (state: typeof GraphState.State) => {
  const prompt = `
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
                    },
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
                    },
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
                                "progress": 100
                            },
                            {
                                "name": "Wake up at 5am",
                                "progress": 0
                            },
                            {
                                "name": "Wake up at 4am",
                                "progress": 0
                            }
                    ]
                }
            ]
    User input is: ${state.messages.map((m) => m.content).join("\n")}`;
  const progressSchema = z.object({
      progresses: z.array(
          z.object({
              diary_id: z.string(),
              target: z.object({
                  name: z.string(),
                  progress: z.number()
              }),
              task_list: z.array(
                  z.object({
                      name: z.string(),
                      progress: z.number()
                  })
              )
          })
      ).describe("The updated progress for tasks and targets")
  });

  const structuredLlm = llm.withStructuredOutput(progressSchema, { name: "extract_progress" });
  const response = await structuredLlm.invoke(prompt);
  return { messages: [new AIMessage("ProgressUpdated.\n" + JSON.stringify(response.progresses))] };
};

const databaseManagerNode = async (state: typeof GraphState.State) => {
  const prompt = `
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
    
        State messages: ${JSON.stringify(state.messages.map(m => m.content))}
    `;

  const llmOutput = await llmWithTools.invoke(prompt);
  let finalResponse = {};

  if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
    const toolCall = llmOutput.tool_calls[0];
    const toolName = toolCall.name;
    const tool = tools.find((t) => t.name === toolName);

    if (tool) {
      const toolResult = await tool.invoke(toolCall.args);
      if (toolName === "get_targets") {
        finalResponse = { fetchedTargets: toolResult };
      } else {
        finalResponse = { UpdatedTargets: toolResult };
      }
    }
  } else {
    finalResponse = { result: llmOutput.content };
  }

  return { messages: [new AIMessage(JSON.stringify(finalResponse))] };
};

// Logic Functions
const routerLogic = (state: typeof GraphState.State) => {
  const nodeContent = state.messages[state.messages.length - 1].content.trim().toLowerCase();
  if (nodeContent.includes("task_list_generator")) return "task_list_generator";
  if (nodeContent.includes("update_progress")) return "database_manager";
  return END;
};

const dbLogic = (state: typeof GraphState.State) => {
  const lastMessage = state.messages[state.messages.length - 1].content;
  if (lastMessage.includes("fetchedTargets")) return "progress_updator";
  if (lastMessage.includes("UpdatedTargets")) return END;
  return "router";
};

const retryPolicy = { maxAttempts: 1, initialInterval: 1.0 };

// Graph Construction
const workflow = new StateGraph(GraphState)
  .addNode("router", routerNode, { retryPolicy })
  .addNode("task_list_generator", taskListGeneratorNode, { retryPolicy })
  .addNode("progress_updator", progressUpdatorNode, { retryPolicy })
  .addNode("database_manager", databaseManagerNode, { retryPolicy })
  .addEdge(START, "router")
  .addConditionalEdges("router", routerLogic, {
    task_list_generator: "task_list_generator",
    database_manager: "database_manager",
    [END]: END,
  })
  .addConditionalEdges("database_manager", dbLogic, {
    progress_updator: "progress_updator",
    [END]: END,
    router: "router",
  })
  .addEdge("progress_updator", "database_manager")
  .addEdge("task_list_generator", END);

const agentApp = workflow.compile();

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ message: "No query provided" }, { status: 400 });
    }

    const responseList = [];
    const stream = await agentApp.stream({
      messages: [new HumanMessage(query)],
    });

    for await (const chunk of stream) {
      for (const value of Object.values(chunk)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedValue = value as any;
        if (typedValue.messages && typedValue.messages.length > 0) {
          const lastMsg = typedValue.messages[typedValue.messages.length - 1];
          responseList.push(lastMsg.content);
        }
      }
    }

    return NextResponse.json({ responses: responseList }, { status: 200 });
  } catch (error) {
    console.error("Error in agent route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
