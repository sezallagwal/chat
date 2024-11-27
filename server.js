import { Server } from "socket.io";
import { createServer } from "http";
import connectDB from "./db.js";
import next from "next";

await connectDB();

const dev = process.env.NODE_ENV !== "production";
const domain = process.env.DOMAIN;
const port = process.env.PORT;

const app = next({ dev, domain, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler);

  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  const userIdToSocketMap = {};

  io.on("connection", async (socket) => {
    const { userId } = socket.handshake.query;
    if (userId) {
      userIdToSocketMap[userId] = socket.id;
      console.log(
        `User with userId: ${userId} connected with socket id: ${socket.id}`
      );
    }

    socket.on("disconnect", () => {
      if (userId) {
        delete userIdToSocketMap[userId];
        console.log(`User with userId: ${userId} disconnected`);
      }
    });

    socket.on("new-chat", ({ sidebarId, participants, lastMessage }) => {
      console.log("New chat created:", sidebarId);

      const unreadCount = 1; // Default unread count for the recipient

      participants.forEach((participantId) => {
        if (
          userIdToSocketMap[participantId] &&
          userIdToSocketMap[participantId] !== socket.id
        ) {
            socket.to(userIdToSocketMap[participantId]).emit("receive-new-chat", {
            sidebarId,
            participants,
            lastMessage, // Include last message details
            unreadCount, // Send unread count
          });
        }
      });
    });

    socket.on("send-message", (data) => {
      const { room, sender, content,readBy, participants } = data;

      // Log message for debugging
      console.log(
        `Message from ${sender}: ${content} to participants:`,
        participants
      );

      // Emit the message to all participants except the sender
      participants.forEach((participantId) => {
        if (participantId !== sender) {
          const participantSocket = userIdToSocketMap[participantId];
          if (participantSocket) {
            socket.to(participantSocket).emit("receive-message", {
              room,
              sender,
              content,
              readBy,
            });
          }
        }
      });
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Ready on http://${domain}:${port}`);
    });
});
