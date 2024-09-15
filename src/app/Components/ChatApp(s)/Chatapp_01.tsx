"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import Loader from "../Loader(s)/Loader";
import MarkdownFormatter from "../MrakdownFormatter/MarkdownFormatter";
import { formatDateForChatMsg } from "@/lib/functions";
import CustomTooltip from "../Tooltip/Tooltip";

interface ChatHistoryProps {
  role: "ai" | "user";
  msg: string;
  time: string | Date;
}
interface PromptsProps {
  getPrompt: (val: string) => void;
}

const shortQaArray = [
  {
    prompt: "Best JS array method?",
    answer:
      "The `map()` method is often considered the best for creating a new array by applying a function to each element of an existing array without modifying the original array.",
  },
  {
    prompt: "CSS for centering?",
    answer:
      "Using `flexbox` is a popular way to center elements in CSS. By setting `display: flex` and using `justify-content: center` and `align-items: center`, you can center an item both horizontally and vertically.",
  },
  {
    prompt: "Popular JavaScript framework?",
    answer:
      "React is one of the most popular JavaScript frameworks, widely used for building user interfaces, particularly for single-page applications.",
  },
  {
    prompt: "Default HTTP method?",
    answer:
      "The default HTTP method is `GET`, which is used to request data from a server without altering any data.",
  },
  {
    prompt: "Type of `null` in JS?",
    answer:
      "In JavaScript, the type of `null` is surprisingly `object`. This is considered a bug in the language but has been kept for legacy reasons.",
  },
];

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, x: 10 },
  visible: { opacity: 1, y: 0, x: 0 },
};

const Prompts = ({ getPrompt }: PromptsProps) => {
  const [loadNewPrompts, setLoadNewPrompts] = useState(true);
  const [nextPromptsSet, setNextPromptsSet] = useState(0);

  useEffect(() => {
    setLoadNewPrompts((prev) => !prev);
  }, [nextPromptsSet]);

  const handlePromptSelection = (val: string) => {
    getPrompt(val);
    setNextPromptsSet((prev) => (prev += 2));
    setLoadNewPrompts(false);
  };
  return (
    loadNewPrompts && (
      <motion.div
        className="w-full flex justify-center gap-2 p-2 absolute z-[9]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {shortQaArray
          .slice(nextPromptsSet, nextPromptsSet + 2)
          .map((item, index) => (
            <motion.div
              key={index}
              className="p-2 bg-black text-teal-50 rounded-full text-sm cursor-pointer hover:bg-slate-800"
              variants={itemVariants}
              onClick={() => handlePromptSelection(item.prompt)}
            >
              {item.prompt}
            </motion.div>
          ))}
      </motion.div>
    )
  );
};

const Chatapp_01 = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryProps[]>([
    {
      role: "ai",
      msg: "HI, I'm your assistent, \n What can I do for you?",
      time: "",
    },
    {
      role: "user",
      msg: "Hey, I'm Bob. ",
      time: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [userInput, setUserInput] = useState("");
  const msgBoxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const msgBox = msgBoxRef.current;
    if (!msgBox) return;
    if (streaming && !scrolling) msgBox.scrollTop = msgBox.scrollHeight;
  }, [chatHistory, streaming, scrolling]);

  useEffect(() => {
    const msgBox = msgBoxRef.current;
    if (!msgBox) return;

    const handleScroll = () => {
      const msgBox = msgBoxRef.current;
      if (!msgBox) return;

      if (
        streaming &&
        Math.round(msgBox.scrollTop) + msgBox.clientHeight < msgBox.scrollHeight
      ) {
        setScrolling(true);
      } else if (
        Math.round(msgBox.scrollTop) + msgBox.clientHeight ===
        msgBox.scrollHeight
      ) {
        setScrolling(false);
      }
    };

    if (streaming) {
      // console.log("Attaching scroll listener");
      msgBox.addEventListener("scroll", handleScroll);
    }

    return () => {
      // console.log("Cleaning up scroll listener");
      msgBox.removeEventListener("scroll", handleScroll);
    };
  }, [streaming]);

  const handleUserPrompt = (prompt: string) => {
    if (prompt === "") return;

    // Abort any previous request if it's still ongoing
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    // Create a new AbortController for this request
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    setLoading(true);
    setStreaming(true);
    setChatHistory((prev) => [
      ...prev,
      {
        role: "user",
        msg: prompt,
        time: formatDateForChatMsg(),
      },
    ]);
    fetch("/api/chatapp/custom-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: prompt,
      signal: signal,
    })
      .then((res) => {
        // Using getReader method we will read the stream data
        const responseTime = res.headers.get("X-Response-Timestamp");
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let streamMsg: string[] = [];
        // Structure 1, using recursion
        reader
          ?.read()
          .then(function readChunk({ done, value }): any {
            if (done) {
              setStreaming(false);
              return;
            }
            const chunk = decoder.decode(value);
            streamMsg.push(chunk);

            if (streamMsg.length === 1) {
              setChatHistory((prev) => [
                ...prev,
                {
                  role: "ai",
                  msg: streamMsg.join(" "),
                  time: responseTime || formatDateForChatMsg(),
                },
              ]);
            }

            setChatHistory((prev) => {
              const newArray = [...prev];
              newArray[newArray.length - 1] = {
                ...newArray[newArray.length - 1],
                role: "ai",
                msg: streamMsg.join(" "),
              }; // Update the last element with the latest streamed chunks
              return newArray;
            });
            return reader.read().then(readChunk);
          })
          .catch((err) => {
            console.log("err", err);
            setStreaming(false);
          });
      })
      .catch((err) => {
        console.log(err);
        setStreaming(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUserInput = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputRef.current) inputRef.current.blur();
    userInput !== null && handleUserPrompt(String(userInput));
    setUserInput("");
  };

  const handleTooltipMsg = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleStreaming = () => {
    if (controllerRef.current) {
      controllerRef.current.abort(); // Abort the fetch request
    }
  };

  return (
    <section className="w-[min(70vw,650px)] h-[700px] border-2 border-slate-500 p-3 rounded-md flex flex-col items-center justify-between">
      <h2 className="text-black text-xl font-medium">Chatapp x 01</h2>

      <main
        ref={msgBoxRef}
        className="scrollbar-hidden relative w-full h-full overflow-x-hidden overflow-y-auto overscroll-none rounded-md border-2 border-slate-300 p-3 mb-2"
      >
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative pb-7"
        >
          {chatHistory.map((data, i) => (
            <motion.li
              key={i}
              variants={itemVariants}
              className={`flex items-start  mb-2  relative ${
                data.role === "ai" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`group p-3 rounded-lg min-w-20   max-w-[90%] ${
                  data.role === "ai" ? "assistant-message" : "user-message"
                }`}
              >
                <div
                  className={`text-xs md:text-sm whitespace-pre-line ${
                    data.role === "ai" ? "text-gray-900" : "text-white"
                  }`}
                >
                  <MarkdownFormatter type={data.role} input={data.msg} />
                </div>
                <p
                  className={`flex justify-between text-xs md:text-sm  mt-1 ${
                    data.role === "ai" ? " text-black" : "text-slate-100"
                  }`}
                >
                  {formatDateForChatMsg()}{" "}
                  <CustomTooltip
                    onCall={() => handleTooltipMsg(data.msg)}
                    dataRole={data.role}
                    preMsg={"Copy"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 -960 960 960"
                      fill={data.role === "ai" ? "#6d6d6d" : "white"}
                    >
                      <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-520q0-17 11.5-28.5T160-720q17 0 28.5 11.5T200-680v520h400q17 0 28.5 11.5T640-120q0 17-11.5 28.5T600-80H200Zm160-240v-480 480Z" />
                    </svg>
                  </CustomTooltip>
                </p>
              </div>
            </motion.li>
          ))}
          <motion.div>{loading && <Loader />}</motion.div>
        </motion.ul>
        <Prompts getPrompt={(val: string) => handleUserPrompt(val)} />
      </main>
      <footer className="w-full">
        <form method="post" onSubmit={handleUserInput} className="flex  gap-2">
          <Input
            placeholder="Write something..."
            className=" focus:border-0"
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <Button
            variant="secondary"
            className="bg-black text-white  hover:bg-slate-900"
            onClick={handleStreaming}
          >
            {streaming ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
              >
                <path d="M360-320h240q17 0 28.5-11.5T640-360v-240q0-17-11.5-28.5T600-640H360q-17 0-28.5 11.5T320-600v240q0 17 11.5 28.5T360-320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
            ) : (
              <p className="flex gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  width={16}
                  fill="#fff"
                >
                  <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                </svg>
                <span>Send</span>
              </p>
            )}
          </Button>
        </form>
      </footer>
    </section>
  );
};

export default Chatapp_01;
