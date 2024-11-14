"use client";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { Card } from "@/components/ui/card";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  interface Message {
    senderId: string;
    roomId: string;
    content: string;
  }

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
      participants: string[];
      messages: Message[]; // Assuming each message has the Message type defined above
    };
  }

  type Chat = {
    _id: string;
    username: string;
    messages: string[];
  };

  const { user } = useUser();
  // const [stream, setStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  // const [isUserCreated, setIsUserCreated] = useState(false);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<Userr | null>(null);

  // const [sentMessage, setSentMessage] = useState<string>("");
  // const [receivedMessage, setReceivedMessage] = useState<string[]>([]); // todo: array?
  // const [chatHistory, setChatHistory] = useState<Message[]>([]);
  // const [afterSearchUser, setAfterSearchUser] = useState<string>("");
  // const [username, setUsername] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState<RoomResponse | null>(null);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [chats, setChats] = useState<Chat[]>([]);

  // const [room, setRoom] = useState<Room[]>([]);

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
          // setIsUserCreated(true);
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
      const newSocket = io(`http://localhost:10000`, {
        query: { userId: currentUserData?._id },
      });
      setSocket(newSocket);
      newSocket.on("connect", () => {
        console.log("connected", newSocket.id);
      });
      newSocket.on("disconnect", () => {
        console.log("disconnected", newSocket.id);
      });

      newSocket.on("message", (message: Message) => {
        console.log("received message", message);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      console.log("current user data not set");
    }

    // newSocket.on("chatHistory", (history) => {
    //   console.log("fetched chat history");
    //   setChatHistory(history);
    // });
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

  // useEffect(() => {
  //   const fetchChatHistory = async () => {
  //     if (isUserCreated && userDetails) {
  //       try {
  //         const response = await fetch("/api/chatHistory", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ clerkId: userDetails.clerkId }),
  //         });

  //         if (!response.ok) {
  //           throw new Error("Failed to fetch chat history");
  //         }

  //         const data = await response.json();
  //         setChatHistory(data.chatHistory);
  //         console.log("Fetched chat history:", data.chatHistory);
  //       } catch (error) {
  //         console.error("Error fetching chat history:", error);
  //       }
  //     }
  //   };

  //   fetchChatHistory();
  // }, [isUserCreated, userDetails]);

  // const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (socket) {
  //     const newSentMessage: Message = {
  //       senderId: userDetails?.clerkId || "",
  //       receiverId: "user_2ngR68qHg4XdRMpC3wnNgmlRNCz",
  //       content: sentMessage,
  //     };
  //     socket.emit("message", newSentMessage);
  //     setChatHistory((prevHistory) => [...prevHistory, newSentMessage]);
  //     setSentMessage("");
  //   }
  // };

  // const searchUser = async (username: string) => {
  //   try {
  //     const response = await fetch("/api/searchUser", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ username }),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to search user");
  //     }

  //     const data = await response.json();
  //     document.body.querySelector(".showSidebar")?.classList.toggle("hidden");
  //     setUsername("");
  //     setAfterSearchUser(data.data.username);
  //     setRoom((prevRoom) => [...prevRoom, { roomId: data.data.clerkId }]);
  //     console.log("Searched user:", data);
  //   } catch (error) {
  //     console.error("Error searching user:", error);
  //   }
  // };

  // const ShowSidebar = () => {
  //   setAfterSearchUser("");
  //   document.body.querySelector(".showSidebar")?.classList.toggle("hidden");
  //   console.log("sidebar toggled");
  // };

  // const showRoom = async (param: string) => {
  //   console.log(param);
  //   try {
  //     await fetch("/api/room", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         friendId: param,
  //         ownId: userDetails?.clerkId,
  //       }),
  //     });
  //   } catch (error) {
  //     console.error("Error creating room:", error);
  //   }
  // };

  // Debounce the search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Adjust the debounce delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  socket?.on(message, (msg) => {
    if (selectedChat) {
      console.log("received message", msg);
      setSelectedChat((prevChat) => {
        if (prevChat) {
          return {
            ...prevChat,
            data: {
              ...prevChat.data,
              messages: [...prevChat.data.messages, msg],
            },
          };
        }
        return prevChat;
      });
    }
  });

  useEffect(() => {
    // Fetch chats from the backend when the search term changes
    const fetchChats = async () => {
      if (debouncedSearchTerm.trim()) {
        try {
          console.log(debouncedSearchTerm);
          const response = await fetch(
            `/api/searchUser?username=${searchTerm}`
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
        setFilteredChats(chats); // Reset to all chats if no search term
      }
    };

    fetchChats();
  }, [debouncedSearchTerm]);

  // Select chat and set initial messages for MainChatArea
  const handleChatSelect = async (chat: Chat) => {
    if (currentUserData) {
      const userId = currentUserData._id;
      const chatUserId = chat._id;

      try {
        const response = await fetch(
          `/api/room?userId=${userId}&chatUserId=${chatUserId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch or create room");
        }
        const room = await response.json();
        console.log("Room found or created:", room);
        setSearchTerm("");
        setSelectedChat(room);
        setChats((prevChats) => {
          if (!prevChats.some((c) => c._id === chat._id)) {
            return [...prevChats, chat];
          }
          return prevChats;
        });
      } catch (error) {
        console.error("Error fetching or creating room:", error);
      }
    }
  };

  // Send a new message in the selected chat
  const handleSendMessage = () => {
    if (selectedChat && message.trim()) {
      const newMessage: Message = {
        roomId: selectedChat.data.roomId,
        senderId: currentUserData?._id || "",
        content: message,
      };
      socket?.emit("message", {
        roomId: selectedChat.data.roomId,
        participants: selectedChat.data.participants,
        senderId: currentUserData?._id || "",
        content: message,
      });
      setSelectedChat((prevChat) => {
        if (prevChat) {
          return {
            ...prevChat,
            data: {
              ...prevChat.data,
              messages: [...prevChat.data.messages, newMessage],
            },
          };
        }
        return prevChat;
      });
      setMessage(""); // Clear the input field after sending
    }
  };

  return (
    <>
      <div className="h-screen bg-black">
        <nav className="bg-neutral-900 fixed w-full z-10 mb-3 rounded-sm">
          <div className="flex justify-around items-center">
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
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>
        <ResizablePanelGroup direction="horizontal" className="pt-[55px]">
          <ResizablePanel
            style={{ minWidth: "100px", marginBottom: "3px" }}
            defaultSize={25}
          >
            <Card className="rounded-sm h-full bg-[#171717] border-transparent mr-1 p-1 text-white flex flex-col gap-1">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <input
                    className="bg-stone-700 border-transparent"
                    placeholder="Enter Username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  ></input>
                  <Button className="bg-lime-600 rounded py-2 px-4">
                    Search
                  </Button>
                </div>
                {/* {afterSearchUser && (
                  <div
                    className="bg-stone-700 p-2 rounded"
                    onClick={ShowSidebar}
                  >
                    {afterSearchUser}
                  </div>
                )} */}
              </div>
              <div className="flex flex-col gap-2 h-full p-1 showSidebar">
                {filteredChats.map((chat) => (
                  <div
                    className="bg-stone-700 px-2 py-3 rounded-sm overflow-hidden text-white"
                    key={chat._id}
                    onClick={() => handleChatSelect(chat)}
                  >
                    {chat.username}
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
            className="scrollbar-thumb scrollbar rounded-sm"
            style={{
              minWidth: "800px",
              overflowY: "auto",
              marginBottom: "3px",
              backgroundColor: "#171717",
            }}
          >
            <Card className="text-white chat-history bg-neutral-900 py-2 scrollbar scrollbar-thumb overflow-auto h-[100%] border-transparent">
              {selectedChat ? (
                <>
                  {selectedChat.data.messages.length > 0 ? (
                    <div className="h-[92%] overflow-auto pl-2">
                      {selectedChat.data.messages.map((msg, index) => (
                        <div key={index} className="">
                          {msg.senderId === currentUserData?._id ? (
                            <div className="flex justify-end w-full">
                              <div className="bg-lime-600 w-fit p-2 m-2 rounded-xl">
                                {msg.content}
                              </div>{" "}
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
                    <div className="h-[92%] overflow-auto pl-2 flex justify-center items-center">
                      <div className="w-fit p-3 bg-lime-600 rounded-xl">
                        No messages to display!
                      </div>
                    </div>
                  )}

                  <div className="bg-neutral-900 flex px-3 text-white pt-2">
                    <input
                      type="text"
                      className="rounded p-2 bg-stone-700 outline-none mr-2 placeholder-white"
                      style={{ flexGrow: 5 }}
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
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
              <div>
                {/* {chatHistory.map((msg, index) => (
                  <div key={index}>
                    {msg.senderId === user?.id ? (
                      <div className="flex justify-end w-full">
                        <div className="bg-lime-600 w-fit p-2 m-2 rounded-xl">
                          {msg.content}
                        </div>{" "}
                      </div>
                    ) : (
                      <div className="flex justify-start w-full">
                        <div className="bg-lime-50 text-black w-fit p-2 m-2 rounded-xl">
                          {msg.content}
                        </div>{" "}
                      </div>
                    )}
                  </div>
                ))} */}
                {/* <div>
                  <div className="flex justify-end w-full">
                    <div className="bg-lime-600 w-fit p-2 m-2 rounded-xl">
                      {sentMessage}
                    </div>{" "}
                  </div>
                </div>

                {receivedMessage.map((msg, index) => (
                  <div key={index}>
                    <div className="flex justify-start w-full">
                      <div className="bg-lime-50 text-black w-fit p-2 m-2 rounded-xl">
                        {msg}
                      </div>{" "}
                    </div>
                  </div>
                ))} */}
              </div>
            </Card>
            {/* <form
              onSubmit={handleSubmit}
              className="bg-neutral-900 py-1 flex px-3 text-white"
            >
              <input
                className="rounded p-2 bg-stone-700 outline-none mr-2 placeholder-white"
                style={{ flexGrow: 5 }}
                value={sentMessage}
                placeholder="Type a message..."
                onChange={(e) => setSentMessage(e.target.value)}
              />
              <button className="bg-lime-600 rounded py-2 px-4">Send</button>
            </form> */}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
