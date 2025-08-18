import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "@/app/langchain/graph";


export async function POST(req: NextRequest) {
    const { message } = await req.json();

    const streamResults = await graph.stream(
        {
            messages: [new HumanMessage({ content: message })],
            sender: "user",
        },
        { recursionLimit: 150 }
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            for await (const output of streamResults as AsyncIterable<Record<string, any>>) {
                if (!("__end__" in output)) {
                    const keys = Object.keys(output);
                    const firstItem = output[keys[0]];
                    const messages = firstItem?.messages;
                    const lastMsg = messages?.[messages.length - 1];

                    if (lastMsg) {
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: lastMsg._getType(),
                            content: lastMsg.content,
                            tool_calls: lastMsg.tool_calls,
                        }) + "\n"));
                    }
                }
            }

            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    });
}