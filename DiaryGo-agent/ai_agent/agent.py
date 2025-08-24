import os
from langchain.chat_models import init_chat_model

from .state import State

os.environ["GOOGLE_API_KEY"] = "AIzaSyASEo5ZANhbtkl1KwMCo_KvCN_c1jetjec"

llm = init_chat_model("google_genai:gemini-2.0-flash")

def chatbot(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

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
    prompt = f"""
        You are an expert in tracking progress on tasks.
        Your job consists of __ steps :
        1. Read the input text from the user.
        2. Fetch the present incomplete targets from other agents.
        3. Summarize the progress made on each task.
        4. Calculate a rough percentage of completion for each task.
        5. Generate a report summarizing the overall progress.

        ### Important:
        - The following examples are ONLY for illustration.  
        - Do **not** copy or reuse them.  
        - Always base your output ONLY on the actual input text provided after "Input text:".  

        Example 1:
        input : "
            I have completed the following tasks: i have watched 1 youtube videos for langchain and practiced it by making a project.
        "
        fetched data: "
            target: Master Langchain and Langgraph
            tasks: (name: watch 2 youtube videos on langchain, progress: 0), 
                   (name: make 3 projects on langchain, progress: 0),
                   (name: upload 3 posts on linkedIn, progress: 0)
        "
        output : (
            target: Master Langchain and Langgraph
            tasks: (name: watch 2 youtube videos on langchain, progress: 50), 
                   (name: make 3 projects on langchain, progress: 33),
                   (name: upload 3 posts on linkedIn, progress: 0)
        )

        User input is: {state["messages"]}
    """
    return {"messages": [llm.invoke(prompt)]}

def database_manager(state: State):
    prompt = f"""
        You are an expert Database Manager. 
        Your abilities are fetching and Updating databases.
        You will:
            Fetch from database:
                - understand
    """