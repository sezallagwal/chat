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

  io.on("connection", async (socket) => {
    // event listener
    console.log(`User with id: ${socket.id} connected`);

    socket.on("disconnect", () => {
      console.log(`User with id: ${socket.id} disconnected`);
    });

    socket.on("message", async (data) => {
      try {
        console.log(data);
        const message = new Message(data);
        await message.save();
        socket.emit("message", message);
        socket.to(data.receiverId).emit("message", message);
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
