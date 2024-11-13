import { Server } from "socket.io";
import { createServer } from "http";
import connectDB from "./db.js";
import Message from "./models/Message.model.js";
import next from "next";

await connectDB(); //connecting to database

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT;

const app = next({ dev, hostname, port });
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

  const clerkIdToSocketMap = {};

  io.on("connection", async (socket) => {
    const { clerkId } = socket.handshake.query;
    // event listener
    if (clerkId) {
      // Map clerkId to socket.id
      clerkIdToSocketMap[clerkId] = socket.id;
      console.log(
        `User with clerkId: ${clerkId} connected with socket id: ${socket.id}`
      );
    }

    socket.on("disconnect", () => {
      if (clerkId) {
        delete clerkIdToSocketMap[clerkId];
        console.log(`User with clerkId: ${clerkId} disconnected`);
      }
    });

    socket.on("message", async (data) => {
      try {
        console.log(data);
        const targetSocketId = clerkIdToSocketMap[data.receiverId];
        console.log(`Mapped clerk IDs: `, clerkIdToSocketMap);
        if (targetSocketId) {
          // Emit message to receiver's socket ID
          io.to(targetSocketId).emit("message", { senderId: data.senderId, content: data.content });
          console.log(
            `Message sent to receiver with socket id: ${targetSocketId}`
          );
        } else {
          console.log("User is offline, message not sent.");
        }

        const message = new Message(data);
        await message.save();
      } catch (error) {
        console.log(error, "Error in saving message");
      }
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Ready on http://${hostname}:${port}`);
    });
});
