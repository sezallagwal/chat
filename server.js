import { Server } from "socket.io";
import { createServer } from "http";
import connectDB from "./db.js";
import Message from "./models/Message.model.js";
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

    socket.on(
      "message",
      async ({ roomId, participants, senderId, content }) => {
        try {
          participants.forEach((participant) => {
            const targetSocketId = userIdToSocketMap[participant];
            console.log(`Mapped user IDs: `, userIdToSocketMap);
            if (targetSocketId) {
              socket.broadcast
                .to(targetSocketId)
                .emit("message", { roomId, senderId, content });
              console.log(
                `Message sent to receiver with socket id: ${targetSocketId}`
              );
            } else {
              console.log("User is offline, message not sent.");
            }
          });

          //todo : validate
          const message = new Message({
            roomId,
            participants,
            senderId,
            content,
          });
          await message.save();
        } catch (error) {
          console.log(error, "Error in saving message");
        }
      }
    );

    socket.on("typing", ({ roomId, participants, senderId }) => {
      participants.forEach((participant) => {
        const targetSocketId = userIdToSocketMap[participant];
        if (targetSocketId) {
          socket.broadcast
            .to(targetSocketId)
            .emit("typing", { roomId, senderId });
          console.log(
            `Typing event sent to receiver with socket id: ${targetSocketId}`
          );
        } else {
          console.log("User is offline, typing event not sent.");
        }
      });
    });

    socket.on("stop-typing", ({ roomId, participants, senderId }) => {
      participants.forEach((participant) => {
        const targetSocketId = userIdToSocketMap[participant];
        if (targetSocketId) {
          socket.broadcast
            .to(targetSocketId)
            .emit("stop-typing", { roomId, senderId });
          console.log(
            `Stop typing event sent to receiver with socket id: ${targetSocketId}`
          );
        } else {
          console.log("User is offline, stop typing event not sent.");
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
