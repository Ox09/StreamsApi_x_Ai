# StreamsAPI with AI Response Generation

## Overview

Welcome to **StreamsAPI with AI Response Generation**, an application built to showcase the implementation of the **Web Streams API** using `fetch()`. This app sends dynamically generated chunked data from the server to the client in real-time using the **Web Streams API**, and integrates AI-driven responses to provide meaningful, interactive content.

## Key Features

- **Web Streams API**: Implements the Web Streams API, allowing for streaming of chunked data to the client in real-time using the `ReadableStream` interface.
- **AI Integration**: Uses an AI model to generate the content of the response, which is then streamed to the client as it is processed.
- **Implementation of Abort Signal**: Use of abort signal interface. You can abort/cancel the streaming from client side and also stop the ai to create the full response, *as it can save your tokens usage.
- **A Custom Markdown Formatter**: Created a custom markdown formatter that more or less formats the lines, formatting contains bold, italic, inline quoted words, comments, links, blockquotes etc[^1].

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Ox09/StreamsApi_x_Ai.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
3. Set up .env file:
   Create an `.env.local` file (if not present, in the root) and
   Add your api key (ex- Cohere), **COHERE_API_KEY** = x0ef........ 

4. Run the development server:
   ```bash
   npm run dev
   ```

## How It Works

### Server-side Implementation

The server uses **Next.js** to handle API routes. When a request is made to the `/api/chatapp/ai-response` endpoint:

- The server reads the incoming prompt.
- The AI model generates the response, which is broken down into chunks.
- These chunks are streamed to the client in real time using the `ReadableStream` interface.
- The stream continues until all chunks are sent, with a `cancel` method to handle aborting the stream.

**Example:**
```javascript
const readableStream = new ReadableStream({
  start(controller) {
    let index = 0;
    const words = "This is an AI-generated response".split(" ");

    function sendNextChunk() {
      if (index >= words.length) {
        controller.close();
        return;
      }

      const chunk = words[index++];
      controller.enqueue(new TextEncoder().encode(chunk + " "));

      setTimeout(sendNextChunk, 100);
    }

    sendNextChunk();
  },
  cancel() {
    console.log("Stream aborted by client.");
  },
});
```

### Client-side Implementation

On the client side, the app makes use of the **Fetch API** to consume the streamed data:

- `fetch()` is used to call the server API.
- The `getReader()` method is used to read the stream data chunk by chunk.
- The chunks are decoded and displayed to the user in real time.
- The `AbortController` can be used to cancel the streaming process from the client side.

**Example:**
```Next js
const controller = useRef<AbortController | null>(null);
const { signal } = controller;

fetch("/api/chatapp/ai-response", {
  method: "POST",
  body: JSON.stringify({ prompt: userPrompt }),
  signal,
})
  .then((response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    function readChunk({ done, value }) {
      if (done) {
        console.log("Stream complete");
        return;
      }

      const chunk = decoder.decode(value);
      console.log("Received chunk: ", chunk);
      
      // Recursively read the next chunk
      reader.read().then(readChunk);
    }

    // Start reading the stream
    reader.read().then(readChunk);
  })
  .catch((error) => {
    if (error.name === "AbortError") {
      console.log("Stream aborted");
    } else {
      console.error("Fetch error: ", error);
    }
  });
```

## Take in mind

1. There are 2-3 different approaches of how can one implement/consume chunks data, one is Recursive Promise callback function and other one is async function with iterator.
2. If you need to modify the response or want to use `WritableStream` or `TransformStream`, use the **Chatapp_01.tsx** file that doesn't use ai So You can save your api *tokens*.

[^1]: The Markdown Formatter Code may get updated later to format codes much better.
---