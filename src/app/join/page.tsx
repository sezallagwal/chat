"use client";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  interface Message {
    sender: string;
    content: string;
  }

  // const [stream, setStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  useEffect(() => {
    const newSocket = io(`http://localhost:3000`);
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("connected", newSocket.id);
    });
    newSocket.on("disconnect", () => {
      console.log("disconnected", newSocket.id);
    });
    newSocket.on("chatHistory", (history) => {
      console.log("fetched chat history");
      setChatHistory(history);
    });
    // const getMediaStream = async () => {
    //   try {
    //     const stream = await navigator.mediaDevices.getUserMedia({
    //       audio: true,
    //       video: true,
    //     });
    //     console.log("got stream", stream);
    //     console.log(stream.getTracks());
    //   } catch (error) {
    //     console.log("error getting stream", error);
    //   }
    // };
    // getMediaStream();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("message", (data) => {
        setChatHistory((prevHistory) => [...prevHistory, data]);
        console.log("received message", data);
      });
    }
  }, [socket]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (socket) {
      const newMessage = { sender: socket.id, content: message };
      socket.emit("message", newMessage);
      setMessage("");
    }
  };

  return (
    <>
<div className="h-screen flex flex-col">
      <nav className="bg-neutral-900 p-1">
          <header className="top-0 h-[50px] flex m-auto justify-around items-center">
            <div>
              <button className="mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="48px"
                  viewBox="0 -960 960 960"
                  width="48px"
                  fill="#65a30d"
                >
                  <path d="M904.31-55 741.35-217.96H311.87q-33.26 0-56.24-23.14-22.98-23.15-22.98-56.64v-80H665.3q32.67 0 55.94-22.98 23.28-22.98 23.28-56.24v-272.08h80q33.49 0 56.64 23.14 23.15 23.15 23.15 56.64V-55ZM135.48-461.74l55.21-55.22H605.3v-309.26H135.48v364.48ZM55.69-270.96v-555.26q0-33.49 23.15-56.63Q101.99-906 135.48-906H605.3q32.67 0 55.94 23.15 23.28 23.14 23.28 56.63v309.26q0 33.26-23.28 56.24-23.27 22.98-55.94 22.98H222.48L55.69-270.96Zm79.79-246v-309.26 309.26Z" />
                </svg>
              </button>
            </div>
            <div className="flex gap-8">
              <button className="bg-lime-600 p-2 flex items-center rounded-xl ">
                Sign-in
              </button>
              <button className="bg-lime-600 p-2 flex items-center rounded-xl ">
                Sign-up
              </button>
            </div>
          </header>
        </nav>

       <div className="chat-history overflow-auto mb-[60px] w-2/3 rounded-xl scrollbar-hide bg-pink-900 p-2">
          {chatHistory.map((msg, index) => (
            <div key={index}>
              {msg.sender === socket?.id ? (
                <div className="flex justify-end w-full">
                  <div className="bg-lime-600 w-fit p-2 m-2 rounded-xl">
                    {msg.content}
                  </div>{" "}
                  <form onSubmit={handleSubmit} className="fixed bottom-3">
                    <input
                      className="rounded p-2 bg-stone-700 outline-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button className="bg-lime-600 rounded p-2">Send</button>
                  </form>
                </div>
              ) : (
                <div className="flex justify-start w-full">
                  <div className="bg-lime-50 text-black w-fit p-2 m-2 rounded-xl">
                    {msg.content}
                  </div>{" "}
                  <form onSubmit={handleSubmit} className="fixed bottom-3">
                    <input
                      className="rounded p-2 bg-stone-700 outline-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button className="bg-lime-600 rounded p-2">Send</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
