
// // export const create_task_list = async (body) => {
// //     const response = await fetch(`/api/create_taskList_agent`, {
// //         method: 'POST',
// //         headers: {
// //             'Content-Type': 'application/json'
// //         },
// //         body: JSON.stringify(body)
// //     });
// //     const result = await response.json();
// //     return { response, result };
// // };


// // lib/api.ts
// export async function sendMessage(message: string) {
//     const res = await fetch("/api/agent", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message }),
//     });

//     if (!res.ok) {
//         throw new Error("Failed to connect to API");
//     }

//     // Because server returns a ReadableStream (SSE-style),
//     // we need to read line-by-line.
//     const reader = res.body?.getReader();
//     const decoder = new TextDecoder();
//     let buffer = "";

//     if (!reader) return [];

//     const messages = [];

//     while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });

//         // Split by newline since your server sends JSON per line
//         const parts = buffer.split("\n");
//         buffer = parts.pop() || "";

//         for (const part of parts) {
//             if (!part.trim()) continue;
//             try {
//                 const parsed = JSON.parse(part);
//                 messages.push(parsed);
//             } catch {
//                 console.warn("Failed to parse chunk:", part);
//             }
//         }
//     }

//     return messages;
// }

const backendUrl = process.env.BACKEND_URL;

export async function sendMessage(message: string) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/graph`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_input: message }),
        });

        if (!response.ok) {
            throw new Error("Failed to connect to API");
        }

        console.log(response)

        const result = await response.json();
        const targetMessages = result.responses[result.responses.length - 1];

        return JSON.parse(targetMessages);

    } catch (error) {
        console.error("Error in sendMessage:", error);
        throw error;
    }
}

// Upload a new task
export async function uploadNewTask(body: { userId: string; target: string; task_list: string[] }) {
    try {
        const response = await fetch(`/api/diary`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error("Failed to connect to API");
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error in uploadNewTask:", error);
        throw error;
    }
}

// fetch all targets from diary
export async function fetchAllTargets(userId: string) {
    try {
        const response = await fetch(`/api/diary?userId=${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to connect to API");
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error in fetchAllTargets:", error);
        throw error;
    }
}

export async function UploadToCalendar(params: { userId: string; date: string; event: string }) {
    try {
        const response = await fetch(`/api/calendar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error("Failed to connect to API");
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error in UploadToCalendar:", error);
        throw error;
    }
}

export async function GetCalendarEvents(params: { userId: string }) {
    try {
        const response = await fetch(`/api/calendar?userId=${params.userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to connect to API");
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error in GetCalendarEvents:", error);
        throw error;
    }
}

export async function UploadAchievement(params: { userId: string, task: string, date: string, time: string }) {
    try {
        const response = await fetch(`/api/achievement`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error("Failed to connect to API");
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error in UploadAchievement:", error);
        throw error;
    }
}

export async function getAchievements(params: { userId: string, date: string }) {

    console.log("userId", params.userId, "date", params.date)
    try {
        const response = await fetch(`/api/achievement?userId=${params.userId}&date=${params.date}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error in getAchievement:", error);
    }
}