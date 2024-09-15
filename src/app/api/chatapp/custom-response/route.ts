import { formatDateForChatMsg } from "@/lib/functions";
import { NextResponse } from "next/server";

// Prompts and answers
const shortQaArray = [
  {
    prompt: "Best JS array method?",
    answer:
      "The map() method is often considered the best for creating a new array by applying a function to each element of an existing array without modifying the original array.",
  },
  {
    prompt: "CSS for centering?",
    answer:
      "Using flexbox is a popular way to center elements in CSS. By setting display: flex and using justify-content: center and align-items: center, you can center an item both horizontally and vertically.",
  },
  {
    prompt: "Popular JavaScript framework?",
    answer:
      "React is one of the most popular JavaScript frameworks, widely used for building user interfaces, particularly for single-page applications.",
  },
  {
    prompt: "Default HTTP method?",
    answer:
      "The default HTTP method is GET, which is used to request data from a server without altering any data.",
  },
  {
    prompt: "Type of null in JS?",
    answer:
      "In JavaScript, the type of null is surprisingly object. This is considered a bug in the language but has been kept for legacy reasons.",
  },
];

export async function POST(req:Response) {
  const prompt = await req.text();

  if (prompt) {
    const answerTobeSend = shortQaArray.find(
      (item) => item.prompt === prompt
    ) || {
      prompt: "No context",
      answer: `🤖 It looks like I'm not sure about that one right now. But no worries! Here's what you can do next:\n
// 1. **Search Online**: You might find the information you're looking for with a quick search on the web.\n
// 2. **Ask a Specialist**: If it's a specialized topic, consider reaching out to an expert or a community forum.\n
// 3. **Check the Documentation**: For technical questions, checking the official documentation or resources related to the topic can be very helpful.\n
// 4. **Feel Free to Ask Another Question**: I'm here to help with any other queries you might have. Just let me know!\n
// Thank you for your understanding, and I’m here to assist with anything else you need! 🙌`,
    };
    const words = answerTobeSend?.answer.split(" ");

    const readableStream = new ReadableStream({
      start(controller) {
        let index = 0;

        // Function to enqueue chunks with delay
        function sendNextChunk() {
          if (index >= words.length) {
            controller.close(); // Close the stream when all chunks are sent
            return;
          }

          const chunk = words[index++];
          controller.enqueue(new TextEncoder().encode(chunk + " "));

          setTimeout(sendNextChunk, 100); // Send next chunk after a delay
        }

        sendNextChunk(); // Start sending chunks
      },
      cancel() {
        console.log('Stream cancelled by the client.');
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain",
        "X-Response-Timestamp": formatDateForChatMsg(),
      },
    });
  } else {
    return new Response(JSON.stringify({ error: "No prompt defined" }), {
      status: 400,
    });
  }
}
