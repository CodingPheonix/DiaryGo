import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "@/app/langchain/graph";

export async function POST(req: NextRequest) {
    const { message } = await req.json();
    console.log("route message:", message);

    try {
        // graph.stream returns a Web ReadableStream in Next.js routes
        const streamResults = await graph.stream(
            {
                messages: [new HumanMessage({ content: message })],
                sender: "user",
            },
            { recursionLimit: 150 }
        );
        console.log("streamResults created:", streamResults);

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const reader = streamResults.getReader(); // attach a reader

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        // value is usually a Uint8Array chunk or an object, depending on graph config
                        const output =
                            typeof value === "string"
                                ? JSON.parse(value)
                                : value instanceof Uint8Array
                                    ? JSON.parse(new TextDecoder().decode(value))
                                    : value; // already an object
                        console.log("Stream output:", output);

                        if (!("__end__" in output)) {
                            const keys = Object.keys(output);
                            const firstItem = output[keys[0]];
                            const messages = firstItem?.messages;
                            const lastMsg = messages?.[messages.length - 1];

                            if (lastMsg) {
                                controller.enqueue(
                                    encoder.encode(
                                        JSON.stringify(
                                            {
                                                type: lastMsg._getType(),
                                                content: lastMsg.content,
                                                tool_calls: lastMsg.tool_calls,
                                            }
                                        ) + "\n"
                                    )
                                );
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (err) {
        console.error("Error calling graph.stream:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
