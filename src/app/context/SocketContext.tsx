"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useUserContext } from "./UserContext";

// Define the type for your socket instance
type SocketContextType = Socket | null;

// Define the context and its default value
const SocketContext = createContext<SocketContextType>(null);

// Define the props for the provider
interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useUserContext();
  const [socket, setSocket] = useState<SocketContextType>(null);

  useEffect(() => {
    if (user) {
      const socketInstance = io({
        query: { userId: user?._id },
      }); // Replace with your backend's URL
      setSocket(socketInstance);
      socketInstance.on("connect", () => {
        console.log("connected", socketInstance.id);
      });
      socketInstance.on("disconnect", () => {
        console.log("disconnected", socketInstance.id);
      });

      // Cleanup the socket connection on component unmount
      return () => {
        socketInstance.disconnect();
      };
    } else {
      console.log("current user not set");
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  return context;
};
