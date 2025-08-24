import { StructuredTool } from "@langchain/core/tools";
import { tool } from "@langchain/core/tools";
import { gemini } from "./agent";
import z from "zod";

export class createTaskList extends StructuredTool {
    name: string = "task_list_generator";
    description: string = "Create a task list out of raw text containing the list of tasks"
    schema = z.object({
        input: z.string().describe("Text containing tasks")
    })

    async _call({ input }: { input: string }) {
        const response = await gemini.invoke(`
            You are an expert in extracting and structuring tasks from unorganized text.
            Your job is to TAKE, UNDERSTAND, SEPARATE, and RETURN the input text as a clean, concise list of actionable tasks.

            Guidelines:
            Take the input text (a lump of unstructured sentences).
            Understand the intent behind each phrase or clause.
            Separate them into distinct, do-able action items.
            Return the final result as a list of short, clear task statements.
                - Remove redundancy.
                - Use proper capitalization.
                - Keep tasks simple and actionable.
            
            Example 1:
                input : "I will have to brush my teeth, wash my face, and take a shower followed by I will also have to eat breakfast and lunch. i also have to do my homework and study for my exam and walk my dog."
                output : ["Brush my teeth", "Wash my face", "Take a shower", "Eat breakfast and Lunch", "Do homework", "Study for exam", "Walk my dog"]

            Example 2:
                input : "Tomorrow I need to buy groceries, call mom, finish my office report, clean the kitchen, and schedule a doctor’s appointment. Later, I should also water the plants and prepare dinner."
                output : ["Buy groceries", "Call mom", "Finish office report", "Clean the kitchen", "Schedule doctor’s appointment", "Water the plants", "Prepare dinner"]

            Input Text : ${input}
        `)

        return typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);
    }
}

export class classification_tool extends StructuredTool {
    name = "classification_tool";
    description = "It figures out which tool to call next based on input text"
    schema = z.object({
        input: z.string().describe("Text to figure out tool to be used")
    })

    async _call({ input }: { input: string }) {
        const prompt = `
            You are an expert routing agent. Your ability is to figure out which agent to use next based on the user's intent.
            Generate only the name of the tool, nothing else.

            Example 1: 
            input : "I want to create a task list from a raw text containing the list of tasks
            output : "task_list_generator"

            The available tools are:
            - task_list_generator: Create a task list out of raw text containing the list of tasks

            User input is: ${input}
        `
        const response = await gemini.invoke(prompt)
        return typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);
    }
}