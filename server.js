import { Server } from "socket.io";
import { createServer } from "http";
import connectDB from "./db.js";
import Message from "./models/Message.model.js";
import next from "next";

await connectDB(); //connecting to database

const dev = process.env.NODE_ENV !== "production";
const domain = process.env.DOMAIN;
const port = process.env.PORT;

const app = next({ dev, domain, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler); //creating server

  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
      methods: ["GET", "POST"],
    },
  }); //making instance of server

  const userIdToSocketMap = {};

  io.on("connection", async (socket) => {
    const { userId } = socket.handshake.query;
    // event listener
    if (userId) {
      // Map userId to socket.id
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
              // Emit message to receiver's socket ID
              socket.broadcast
                .to(targetSocketId)
                .emit("message", { roomId, senderId, content });
              // io.to(targetSocketId).emit("message", { senderId, content });
              console.log(
                `Message sent to receiver with socket id: ${targetSocketId}`
              );
            } else {
              console.log("User is offline, message not sent.");
            }
          });

          //todo : valid
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
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Ready on https://${domain}:${port}`);
    });
});
