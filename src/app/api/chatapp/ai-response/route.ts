import { formatDateForChatMsg } from "@/lib/functions";
import { CohereClient } from "cohere-ai";
import { NextRequest, NextResponse } from "next/server";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function POST(req: NextRequest) {
  const prompt = await req.text();
  const abortController = new AbortController();
  const stream = await cohere.chatStream(
    {
      model: "command-r-plus-08-2024",
      message: prompt,
    },
    {
      abortSignal: abortController.signal,
    }
  );

  const readableStream = new ReadableStream({
    start(controller) {
      if (!req.body) {
        return;
      }
      async function createStream() {
        try {
          for await (const chat of stream) {
            if (chat.eventType === "text-generation") {
              controller.enqueue(new TextEncoder().encode(chat.text));
            } else if (chat.eventType === "stream-end") {
              controller.close();
            }
          }
        } catch (err) {
          if (err instanceof Error) {
            if (err.name === "AbortError") {
              console.log("Stream aborted");
              controller.close();
            }

            return NextResponse.json(
              { error: "Internal Server Error", details: err.message },
              { status: 500 }
            );
          } else {
            console.error("Unknown error:", err);

            return NextResponse.json(
              {
                error: "Internal Server Error",
                details: "Unknown error occurred",
              },
              { status: 500 }
            );
          }
        }
      }
      createStream();
    },
    cancel() {
      abortController.abort();
      console.log("Ai text generation canceled")
    },
  });
  // Handle client disconnection (optional)
  // req.signal.addEventListener("abort", () => {
  //   abortController.abort();
  //   console.log("Disconnected");
  // });
  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/plain",
      "X-Response-Timestamp": formatDateForChatMsg(),
    },
  });
}
