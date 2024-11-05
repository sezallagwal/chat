"use client";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

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
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("connected", newSocket.id);
    });
    newSocket.on("disconnect", () => {
      console.log("disconnected", newSocket.id);
    });
    newSocket.on("chatHistory", (history) => {
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
        console.log(data);
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
      console.log("submitted", newMessage);
      setMessage("");
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center flex-col">
      <div className="chat-history overflow-auto mb-[60px] w-full">
        {chatHistory.map((msg, index) => (
          <p
            className="bg-stone-600 w-fit m-auto text-white mb-2 p-2 rounded-xl"
            key={index}
          >
            {msg.content}
          </p>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="fixed bottom-3">
        <input
          className="rounded p-2 bg-stone-700 outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="bg-lime-500 rounded p-2">Send</button>
      </form>
    </div>
  );
}
