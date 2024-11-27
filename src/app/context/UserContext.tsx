"use client"
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";

type User = {
  _id?: string;
  username: string;
  email: string;
  clerkId: string;
  profileImage: string;
};

// Define the UserContextType
type UserContextType = {
  user: User | undefined;
  isLoading: boolean;
};

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the props for the provider
interface UserProviderProps {
  children: ReactNode;
}

// Create the UserProvider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [userDetails, setUserDetails] = useState<User | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      setUserDetails({
        username: user?.username || "Guest",
        email: user?.emailAddresses[0]?.emailAddress || "No email provided",
        clerkId: user?.id || "",
        profileImage: user?.imageUrl || "/default-profile.png",
      });
    }
  }, [user, isLoaded]);

  useEffect(() => {
    const createUser = async () => {
      if (userDetails && !currentUser) {
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
          setCurrentUser(data.data);
          // console.log("User created:", data);
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    };

    createUser();
  }, [userDetails, currentUser]);

  return (
    <UserContext.Provider value={{ user: currentUser, isLoading: !isLoaded }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
