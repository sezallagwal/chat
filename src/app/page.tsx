"use client";
import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { Card } from "@/components/ui/card";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import "./globals.css";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  type Message = {
    senderId: string;
    roomId: string;
    content: string;
    username?: string;
    timestamp: string;
  };

  interface User {
    // _id: string;
    username: string;
    email: string;
    clerkId: string;
    profileImage: string;
  }
  interface Userr {
    _id: string;
    username: string;
    email: string;
    clerkId: string;
    profileImage: string;
  }

  interface RoomResponse {
    data: {
      roomId: string;
      username: string;
      participants: string[];
      profileImage: string;
      messages: Message[];
    };
  }

  type Chat = {
    profileImage: string;
    _id: string;
    username: string;
    chatUserId?: string;
    hasUnread?: boolean;
    userId?: string;
    myUsername?: string;
  };

  const { user } = useUser();
  // const [stream, setStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<Userr | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState<RoomResponse | null>(null);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [chats, setChats] = useState<Chat[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef(selectedChat);

  useEffect(() => {
    if (user) {
      setUserDetails({
        username: user.username || "",
        email: user.emailAddresses[0].emailAddress,
        clerkId: user.id,
        profileImage: user.imageUrl,
      });
    }
  }, [user]);

  useEffect(() => {
    const createUser = async () => {
      if (userDetails) {
        try {
          const response = await fetch("/api/createUser", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userDetails),
          });

          if (!response.ok) {
            throw new Error("Failed to create user");
          }

          const data = await response.json();
          setCurrentUserData(data.data);
          console.log("User created:", data);
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    };

    createUser();
  }, [userDetails]);

  useEffect(() => {
    if (currentUserData) {
      // const domain = process.env.NEXT_PUBLIC_DOMAIN;
      // const port = process.env.NEXT_PUBLIC_PORT;
      const newSocket = io({
        query: { userId: currentUserData?._id },
      });
      setSocket(newSocket);
      newSocket.on("connect", () => {
        console.log("connected", newSocket.id);
      });
      newSocket.on("disconnect", () => {
        console.log("disconnected", newSocket.id);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      console.log("current user data not set");
    }

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
  }, [currentUserData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchChats = async () => {
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
          console.log("users found", data);
          setFilteredChats(data);
        } catch (error) {
          console.error("Failed to fetch chats:", error);
        }
      } else {
        setFilteredChats(chats);
        console.log("chats set to filtered chats", chats);
      }
    };

    fetchChats();
  }, [debouncedSearchTerm, chats]);

  const handleChatSelect = async (chat: Chat) => {
    console.log("chat", chat);
    if (currentUserData) {
      const userId = currentUserData._id;
      const chatUserId = chat._id;
      const username = chat.username;
      const myUsername = currentUserData.username;
      const profileImage = chat.profileImage;
      const myProfileImage = currentUserData.profileImage;

      try {
        const response = await fetch(
          `/api/room?userId=${userId}&chatUserId=${chatUserId}&username=${username}&myUsername=${myUsername}&profileImage=${profileImage}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch or create room");
        }
        const room: RoomResponse = await response.json();
        console.log("Room found or created:", room);
        setSearchTerm("");
        setSelectedChat({ data: room.data });
        setChats((prevChats) => {
          if (!prevChats.some((c) => c.username === chat.username)) {
            return [...prevChats, chat];
          } else {
            return prevChats;
          }
        });
        const sidebar = await fetch(
          `/api/sidebar?userId=${userId}&chatUserId=${chatUserId}&username=${username}&profileImage=${profileImage}&myUsername=${myUsername}&myProfileImage=${myProfileImage}`
        );

        if (!sidebar.ok) {
          throw new Error("Failed to post data to sidebar");
        }
        const sidebarData = await sidebar.json();
        console.log("Sidebar data posted successfully", sidebarData);
        // const sidebarData = await sidebar.json();
        // console.log("Sidebar data", sidebarData);
      } catch (error) {
        console.error("error adding user in sidebar:", error);
      }
    }
  };

  const handleSendMessage = () => {
    if (selectedChat && message.trim()) {
      console.log("selected chat in handle send message", selectedChat);
      const newMessage: Message = {
        roomId: selectedChat.data.roomId,
        senderId: currentUserData?._id || "",
        content: message,
        username: currentUserData?.username || "",
        timestamp: new Date().toISOString(),
      };

      // Emit the message through the socket
      socket?.emit("message", {
        roomId: selectedChat.data.roomId,
        participants: selectedChat.data.participants,
        senderId: currentUserData?._id || "",
        content: message,
      });

      // Update selectedChat immutably
      setSelectedChat((prevSelectedChat) =>
        prevSelectedChat
          ? {
              data: {
                ...prevSelectedChat.data,
                messages: [...prevSelectedChat.data.messages, newMessage],
              },
            }
          : null
      );

      // Move the chat to the top in filteredChats
      setFilteredChats((prevFilteredChats) => {
        const updatedChats = [...prevFilteredChats];

        // Find the chat in the list
        const chatIndex = updatedChats.findIndex(
          (chat) => chat.username === selectedChat.data.username
        );

        if (chatIndex !== -1) {
          const chat = updatedChats[chatIndex];

          // Move the chat to the top
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chat);
        }

        return updatedChats;
      });

      console.log("selectedChat after handleSendMessage", selectedChat);
      setMessage("");
    }
  };

  useEffect(() => {
    const fetchSidebar = async () => {
      if (currentUserData) {
        const userId = currentUserData._id;
        try {
          const sidebar = await fetch(`/api/sidebarUsers?userId=${userId}`);

          if (!sidebar.ok) {
            throw new Error("Failed to fetch sidebar");
          }
          const sidebarData = await sidebar.json();
          console.log("Sidebar data fetched successfully", sidebarData);
          sidebarData.data.allSidebarUsers.forEach((chat: Chat) => {
            setChats((prevChats) => {
              if (!prevChats.some((c) => c.username === chat.username)) {
                return [
                  ...prevChats,
                  {
                    _id: chat.chatUserId || "",
                    chatUserId: chat.chatUserId || "",
                    username: chat.username,
                    profileImage: chat.profileImage,
                  },
                ];
              }
              return prevChats;
            });
          });
        } catch (error) {
          console.error("Error fetching or creating room:", error);
        }
      }
    };
    fetchSidebar();
  }, [currentUserData]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const messageHandler = (msg: Message) => {
      console.log("socket on msg", msg);
      if (
        selectedChatRef.current &&
        selectedChatRef.current.data.roomId === msg.roomId
      ) {
        selectedChatRef.current.data.messages.push({
          senderId: msg.senderId,
          roomId: msg.roomId,
          content: msg.content,
          timestamp: new Date().toISOString(),
        });
        setSelectedChat({ ...selectedChatRef.current });
      }

      // Update the filtered chats
      setFilteredChats((prevFilteredChats) => {
        const updatedChats = [...prevFilteredChats];

        // Find the chat to update
        const chatIndex = updatedChats.findIndex(
          (chat) => chat.chatUserId === msg.senderId
        );

        if (chatIndex !== -1) {
          const chat = updatedChats[chatIndex];

          // Move the chat to the top
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift({
            ...chat,
            hasUnread:
              !selectedChatRef.current ||
              selectedChatRef.current.data.roomId !== msg.roomId, // Show red dot if not selected
          });
        }
        return updatedChats;
      });

      console.log("filtered chats updated", filteredChats);
    };

    socket?.on("message", messageHandler);

    return () => {
      socket?.off("message", messageHandler);
    };
  }, [socket, filteredChats]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [selectedChat]);

  return (
    <>
      <div className="h-screen bg-black">
        <ResizablePanelGroup direction="horizontal" className="">
          <ResizablePanel
            style={{
              minWidth: "300px",
              marginBottom: "3px",
              maxWidth: "600px",
            }}
            defaultSize={25}
          >
            <nav className="bg-neutral-800 z-10 mr-1 px-2 py-[0.35rem] rounded-sm">
              <div className="flex justify-between items-center">
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
                <div className="flex gap-8">
                  <SignedIn>
                    <UserButton
                      appearance={{
                        elements: { userButtonAvatarBox: "w-[46px] h-[46px]" },
                      }}
                    />
                  </SignedIn>
                </div>
              </div>
            </nav>
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
                {filteredChats.map((chat) => (
                  <div
                    className="bg-stone-700 px-2 py-2 rounded-sm overflow-hidden text-white flex items-center gap-2 cursor-pointer"
                    key={chat._id}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div>
                      <Image
                        src={chat.profileImage}
                        alt={`${chat.username}'s profile image`}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />{" "}
                    </div>
                    <div className="">
                      {chat.username}{" "}
                      {chat.hasUnread && (
                        <span className="w-2 h-2 bg-red-600 rounded-full inline-block" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </ResizablePanel>
          <ResizableHandle
            style={{ width: "1px", backgroundColor: "#171717" }}
          />
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
              {selectedChat ? (
                <>
                  <div className="bg-neutral-800 z-10 mr-1 px-2 py-2 text-lg rounded-sm mb-2 flex gap-4 items-center backdrop-blur-3xl">
                    <Image
                      loading="eager"
                      src={selectedChat.data.profileImage}
                      alt={`${selectedChat.data.username}'s profile image`}
                      width={44}
                      height={44}
                      className="rounded-full"
                    />
                    <div>{selectedChat.data.username}</div>
                  </div>
                  {selectedChat.data.messages.length > 0 ? (
                    <div
                      className="h-[83%] overflow-auto pl-2 w-full"
                      ref={chatContainerRef}
                    >
                      {selectedChat.data.messages.map((msg, index) => (
                        <div key={index} className="">
                          {msg.senderId === currentUserData?._id ? (
                            <div className="flex justify-end w-full">
                              <div className="max-w-1/2">
                                <div className="bg-lime-600 w-fit p-2 m-2 rounded-xl overflow-y-auto">
                                  {msg.content}
                                </div>{" "}
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-start w-full">
                              <div className="bg-lime-50 text-black w-fit p-2 m-2 rounded-xl">
                                {msg.content}
                              </div>{" "}
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
                      type="text"
                      className="rounded p-3 bg-stone-700 outline-none mr-2 placeholder-white"
                      style={{ flexGrow: 5 }}
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
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
              <div></div>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
