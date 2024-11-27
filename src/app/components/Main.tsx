"use client";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import { useUserContext } from "../context/UserContext";
import Navbar from "./Navbar";
import { nanoid } from "nanoid";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Image from "next/image";

interface SidebarChat {
  _id: string | null;
  participants: Array<{
    _id: string;
    username: string;
    profileImage: string;
  }>;
  lastMessage: {
    content: string;
    sender: {
      _id: string;
      username: string;
    };
    timestamp: string;
    readBy: Array<string>;
  };
  unreadCount: Record<string, number>;
  updatedAt: string;
}

interface ActiveChat {
  sidebar: {
    _id: string | null;
    participants: Array<{
      _id: string;
      username: string;
      profileImage: string;
    }>;
  };
  messages: Array<{
    room: string;
    content: string;
    sender: { _id: string; username: string };
    timestamp: string;
    readBy: Array<string>;
  }>;
}

interface SearchUser {
  _id: string;
  username: string;
  profileImage: string;
}

export default function Main() {
  const socket = useSocket();
  const { user, isLoading } = useUserContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [sidebarChats, setSidebarChats] = useState<SidebarChat[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const SearchUsers = async () => {
      if (debouncedSearchTerm.trim()) {
        try {
          // console.log(debouncedSearchTerm);
          const response = await fetch(
            `/api/searchUser?username=${debouncedSearchTerm}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch chats");
          }
          const data = await response.json();
          // console.log("users found", data);
          setSearchResults(data);
        } catch (error) {
          console.error("Failed to fetch chats:", error);
        }
      } else {
        setSearchResults([]);
      }
    };

    SearchUsers();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const fetchSidebar = async () => {
      if (user && !isLoading) {
        const userId = user._id;
        try {
          const sidebar = await fetch(`/api/sidebar/get?userId=${userId}`);

          if (!sidebar.ok) {
            throw new Error("Failed to fetch sidebar");
          }
          const sidebarResponse = await sidebar.json();
          // console.log("Sidebar data fetched successfully", sidebarResponse);
          setSidebarChats(sidebarResponse.allSidebarUsers);
        } catch (error) {
          console.error("Error fetching or creating room:", error);
        }
      }
    };
    fetchSidebar();
  }, [user, isLoading]);

  const handleChatSelect = async (searchResultUser: SearchUser) => {
    // console.log("search result user on select", searchResultUser);
    if (user) {
      try {
        const existingChat = sidebarChats.find((sidebarChat) =>
          sidebarChat.participants.some((p) => p._id === searchResultUser._id)
        );

        if (existingChat) {
          // Chat exists, Fetch messages and set active chat
          // console.log("chat exists", existingChat);
          if (!existingChat._id) {
            console.error("Chat ID not found in existing chat:", existingChat);
            setActiveChat({ sidebar: existingChat, messages: [] });
            return;
          }
          const response = await axios.get(
            `/api/message/get?chatId=${existingChat._id}`
          );
          // console.log("messages found", response);
          setActiveChat({
            sidebar: existingChat,
            messages: response.data.messages,
          });
        } else {
          setSidebarChats((prev) => [
            {
              _id: null,
              participants: [
                {
                  _id: user._id || "",
                  username: user.username,
                  profileImage: user.profileImage,
                },
                {
                  _id: searchResultUser._id,
                  username: searchResultUser.username,
                  profileImage: searchResultUser.profileImage,
                },
              ],
              lastMessage: {
                content: "",
                sender: { _id: "", username: "" },
                timestamp: "",
                readBy: [],
              },
              unreadCount: {
                [user._id || ""]: 0,
                [searchResultUser._id]: 0,
              },
              updatedAt: "",
            },
            ...prev,
          ]);

          // Initialize active chat locally
          setActiveChat({
            sidebar: {
              _id: null,
              participants: [
                {
                  _id: user._id || "",
                  username: user.username,
                  profileImage: user.profileImage,
                },
                {
                  _id: searchResultUser._id,
                  username: searchResultUser.username,
                  profileImage: searchResultUser.profileImage,
                },
              ],
            },
            messages: [],
          });
        }
        setSearchTerm("");
      } catch (error) {
        console.error("error adding user in sidebar:", error);
      }
    }
  };

  const handleSidebarUpdate = (
    sidebarId: string,
    lastMessage: {
      content: string;
      sender: { _id: string; username: string };
      timestamp: string;
      readBy: Array<string>;
    }
  ) => {
    setSidebarChats((prev) => {
      // console.log("sidebar Id", sidebarId);
      if (!sidebarId) {
        console.error("Sidebar ID not found in handleSidebarUpdate");
        return prev;
      }
      const updatedChats = prev.map((chat) =>
        chat._id === sidebarId
          ? {
              ...chat,
              lastMessage, // Update the lastMessage
            }
          : chat
      );

      return updatedChats.sort(
        (a, b) =>
          new Date(b.lastMessage.timestamp).getTime() -
          new Date(a.lastMessage.timestamp).getTime()
      );
    });

    // console.log(
    //   "Sidebar chats after sorting by lastMessage.timestamp:",
    //   sidebarChats
    // );
  };

  // useEffect(() => {
  //   console.log("sidebarChats", sidebarChats);
  // }, [sidebarChats]);

  useEffect(() => {
    // Add the event listener
    socket?.on("receive-new-chat", (newChat) => {
      // console.log("New chat received:", newChat);

      const { sidebarId, lastMessage, unreadCount } = newChat;

      setSidebarChats((prev) => {
        const updatedChats = [
          {
            _id: sidebarId,
            participants: [
              {
                _id: user?._id,
                username: user?.username,
                profileImage: user?.profileImage,
              },
              {
                _id: lastMessage.sender._id,
                username: lastMessage.sender.username,
                profileImage: lastMessage.sender.profileImage,
              },
            ],
            lastMessage: {
              content: lastMessage.content,
              sender: lastMessage.sender,
              timestamp: new Date().toISOString(),
              readBy: lastMessage.readBy,
            },
            unreadCount,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
        // console.log("updated sidebar chats", updatedChats);

        return updatedChats;
      });
    });

    socket?.on("receive-message", (message) => {
      // console.log("New message received:", message);

      // Update active chat messages
      setActiveChat((prev) => {
        if (prev && prev?.sidebar._id === message.room) {
          return {
            ...prev,
            messages: [
              ...(prev.messages || []),
              {
                room: message.room,
                content: message.content,
                sender: {
                  _id: message.sender._id,
                  username: message.sender.username,
                },
                timestamp: new Date().toISOString(),
                readBy: [message.sender],
              },
            ],
          };
        }
        return prev;
      });

      handleSidebarUpdate(message.room, {
        content: message.content,
        sender: { _id: message.sender._id, username: message.sender.username },
        timestamp: new Date().toISOString(),
        readBy: [message.sender],
      });
    });

    return () => {
      socket?.off("receive-new-chat");
      socket?.off("receive-message");
    };
  }, [socket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const isNewChat = !activeChat?.sidebar._id;

      // If it's a new chat, create the sidebar entry
      if (isNewChat) {
        const sidebarResponse = await axios.post("/api/sidebar/post", {
          participants: activeChat?.sidebar.participants.map((p) => p._id),
        });
        const newSidebar = sidebarResponse.data.newSidebar;
        // console.log("sidebar posted", newSidebar);

        setSidebarChats((prev) =>
          prev.map((chat) =>
            chat._id === null &&
            chat.participants.length ===
              activeChat?.sidebar.participants.length &&
            chat.participants.every((p) =>
              activeChat.sidebar.participants.some((ap) => ap._id === p._id)
            )
              ? { ...chat, _id: newSidebar._id }
              : chat
          )
        );

        // Emit the new-chat event
        socket?.emit("new-chat", {
          sidebarId: newSidebar._id,
          participants: newSidebar.participants,
          lastMessage: {
            content: newMessage.trim(),
            sender: {
              _id: user?._id || "",
              username: user?.username || "",
              profileImage: user?.profileImage || "",
            },
            readBy: [user?._id || ""],
          },
        });
        // console.log("active chat before", activeChat);
        // Update active chat with new sidebar ID
        setActiveChat((prev) => {
          if (!prev) return prev;
          const updatedChat = {
            messages: [
              ...prev.messages,
              {
                room: newSidebar._id,
                content: newMessage,
                sender: {
                  _id: user?._id || "",
                  username: user?.username || "",
                },
                timestamp: new Date().toISOString(),
                readBy: [user?._id || ""],
              },
            ],
            sidebar: { ...prev.sidebar, _id: newSidebar._id },
          };
          return updatedChat;
        });

        // Update the sidebar lastMessage
        handleSidebarUpdate(newSidebar._id as string, {
          content: newMessage.trim(),
          sender: { _id: user?._id || "", username: user?.username || "" },
          timestamp: new Date().toISOString(),
          readBy: [user?._id || ""],
        });

        // Send the message
        await axios.post("/api/message/post", {
          room: newSidebar._id,
          sender: user?._id,
          content: newMessage.trim(),
        });

        // const message = messageResponse.data.message;
        // console.log("message sent", message);
      } else {
        // Update the message list in active chat messages array
        setActiveChat((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                room: prev.sidebar._id || "",
                content: newMessage,
                sender: {
                  _id: user?._id || "",
                  username: user?.username || "",
                },
                timestamp: new Date().toISOString(),
                readBy: [user?._id || ""],
              },
            ],
          };
        });

        // Update the sidebar lastMessage
        handleSidebarUpdate(activeChat?.sidebar._id as string, {
          content: newMessage.trim(),
          sender: { _id: user?._id || "", username: user?.username || "" },
          timestamp: new Date().toISOString(),
          readBy: [user?._id || ""], // Assuming the sender has already read it
        });

        // Emit socket event for the new message
        socket?.emit("send-message", {
          room: activeChat?.sidebar._id,
          sender: { _id: user?._id, username: user?.username },
          content: newMessage.trim(),
          readBy: [user?._id],
          participants: activeChat?.sidebar.participants.map((p) => p._id),
        });

        // Send the message
        await axios.post("/api/message/post", {
          room: activeChat?.sidebar._id,
          sender: user?._id,
          content: newMessage.trim(),
        });

        // const message = messageResponse.data.message;
        // console.log("message sent", message);
      }
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    messageInputRef.current?.focus();
  }, [activeChat]);

  return (
    <ResizablePanelGroup direction="horizontal" className="">
      <ResizablePanel
        style={{
          minWidth: "300px",
          marginBottom: "3px",
          maxWidth: "600px",
        }}
        defaultSize={25}
      >
        <Navbar />
        <Card className="px-1 pt-2 rounded-sm h-full bg-[#171717] border-transparent mr-1 text-white flex flex-col gap-1">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <input
                className="bg-stone-700 border-transparent flex-grow py-3 px-2 rounded outline-none"
                placeholder="Enter Username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              ></input>
              <button className="bg-lime-600 rounded px-4">Search</button>
            </div>
          </div>
          <div className="flex flex-col gap-2 h-full py-1 showSidebar text-lg">
            {/* Show Search Results or Sidebar Chats */}
            {searchTerm && searchResults.length > 0
              ? searchResults.map((searchResultUser) => (
                  <div
                    key={searchResultUser._id}
                    className="search-result-item flex items-center p-2 cursor-pointer bg-stone-700 px-2 py-3 rounded-sm overflow-hidden text-white gap-2"
                    onClick={() => handleChatSelect(searchResultUser)}
                  >
                    <Image
                      src={searchResultUser.profileImage}
                      alt={searchResultUser.username}
                      width={46}
                      height={46}
                      className="rounded-full mr-2"
                    />
                    <span>{searchResultUser.username}</span>
                  </div>
                ))
              : sidebarChats.map((chat) => {
                  const otherParticipant = chat.participants.find(
                    (p) => p._id !== user?._id
                  );
                  return (
                    <div
                      key={nanoid()}
                      className="chat-item flex items-center p-2 cursor-pointer bg-stone-700 px-2 py-3 rounded-sm overflow- text-white gap-2 pr-6"
                      onClick={() =>
                        handleChatSelect(otherParticipant as SearchUser)
                      }
                    >
                      <Image
                        src={
                          Array.isArray(chat.participants)
                            ? (otherParticipant?.profileImage as string)
                            : ""
                        }
                        width={46}
                        height={46}
                        alt={
                          Array.isArray(chat.participants)
                            ? (otherParticipant?.username as string)
                            : "Unknown"
                        }
                        className="rounded-full mr-2"
                      />
                      <div className="truncate">
                        <p>
                          {Array.isArray(chat.participants)
                            ? (otherParticipant?.username as string)
                            : "Unknown"}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {chat.lastMessage?.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </Card>
      </ResizablePanel>
      <ResizableHandle style={{ width: "1px", backgroundColor: "#171717" }} />
      <ResizablePanel
        defaultSize={75}
        className="scrollbar-thumb scrollbar"
        style={{
          minWidth: "800px",
          overflowY: "auto",
          marginBottom: "3px",
          backgroundColor: "#171717",
        }}
      >
        <Card className="text-white chat-history bg-neutral-900 scrollbar scrollbar-thumb overflow-auto h-[100%] border-transparent w-full rounded-sm">
          {activeChat ? (
            <>
              <div className="bg-neutral-800 z-10 mr-1 px-2 py-2 text-lg rounded-sm mb-2 flex gap-4 items-center backdrop-blur-3xl">
                <Image
                  loading="eager"
                  src={
                    activeChat.sidebar.participants.find(
                      (p) => p._id !== user?._id
                    )?.profileImage as string
                  }
                  alt={
                    activeChat.sidebar.participants.find(
                      (p) => p._id !== user?._id
                    )?.username as string
                  }
                  width={44}
                  height={44}
                  className="rounded-full"
                />
                <div>
                  {
                    activeChat.sidebar.participants.find(
                      (p) => p._id !== user?._id
                    )?.username as string
                  }
                </div>
              </div>
              {activeChat.messages && activeChat.messages.length > 0 ? (
                <div
                  className="h-[83%] overflow-auto pl-2 w-full"
                  ref={chatContainerRef}
                >
                  {activeChat.messages.map((msg, index) => (
                    <div key={index}>
                      {msg.sender._id === user?._id ? (
                        <div className="flex justify-end w-full">
                          <div className="max-w-1/2">
                            <div className="bg-lime-600 w-fit p-2 m-2 rounded-xl overflow-y-auto">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start w-full">
                          <div className="bg-lime-50 text-black w-fit p-2 m-2 rounded-xl">
                            {msg.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[83%] overflow-auto pl-2 flex justify-center items-center">
                  <div className="w-fit p-3 bg-lime-600 rounded-xl">
                    No messages to display!
                  </div>
                </div>
              )}

              <div className="bg-neutral-900 flex px-3 text-white pt-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  className="rounded p-3 bg-stone-700 outline-none mr-2 placeholder-white"
                  style={{ flexGrow: 5 }}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-lime-600 rounded py-2 px-4"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="h-[92%] overflow-auto pl-2 flex justify-center items-center">
              <div className="w-fit p-3 bg-lime-600 rounded-xl">
                Select a Chat to Start Talking
              </div>
            </div>
          )}
        </Card>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
