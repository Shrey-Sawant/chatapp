import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import messageRouter from "./routes/message.routes.js";
import friendRequestRouter from "./routes/freindReq.routes.js";
import { User } from "./models/user.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const roomMembers = {};

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId || userId === "undefined") return socket.disconnect();

  userSocketMap[userId] = socket.id;

  const user = await User.findById(userId).populate("friends", "_id");

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", async () => {
    delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("typing", ({ receiverId }) => {
    if (friendIds.includes(receiverId)) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("displayTyping", userId);
    }
  });

  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    if (userId) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("Call Accepted", data.signal);
  });
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.set("trust proxy", 1);

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/friends", friendRequestRouter);

export { io, app, server };
