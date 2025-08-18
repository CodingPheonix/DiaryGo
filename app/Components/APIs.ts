
// export const create_task_list = async (body) => {
//     const response = await fetch(`/api/create_taskList_agent`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(body)
//     });
//     const result = await response.json();
//     return { response, result };
// };


// lib/api.ts
export async function sendMessage(message: string) {
    const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });

    if (!res.ok) {
        throw new Error("Failed to connect to API");
    }

    // Because server returns a ReadableStream (SSE-style),
    // we need to read line-by-line.
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (!reader) return [];

    const messages = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by newline since your server sends JSON per line
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
            if (!part.trim()) continue;
            try {
                const parsed = JSON.parse(part);
                messages.push(parsed);
            } catch {
                console.warn("Failed to parse chunk:", part);
            }
        }
    }

    return messages;
}
