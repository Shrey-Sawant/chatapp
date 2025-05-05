import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { ExpressPeerServer } from "peer";
dotenv.config();

const app = express();
const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/",
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", " PUT", "DELETE"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("room-disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
      socket.leave(roomId);
    });
  });

  socket.on("send-answer", ({ targetUserId, answer, senderId }) => {
    const targetSocket = userSocketMap[targetUserId];
    if (targetSocket) {
      io.to(targetSocket).emit("receive-answer", { answer, senderId });
    }
  });

  socket.on("send-offer", ({ targetUserId, offer, senderId }) => {
    const targetSocket = userSocketMap[targetUserId];
    if (targetSocket) {
      io.to(targetSocket).emit("receive-offer", { offer, senderId });
    }
  });

  socket.on("send-ice-candidate", ({ targetUserId, candidate, senderId }) => {
    const targetSocket = userSocketMap[targetUserId];
    if (targetSocket) {
      io.to(targetSocket).emit("receive-ice-candidate", {
        candidate,
        senderId,
      });
    }
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", " PUT", "DELETE"],
    credentials: true,
  })
);

app.use(peerServer);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.set("trust proxy", 1);

// http://localhost:8000/api
import authRouter from "./routes/auth.routes.js";
import messageRouter from "./routes/message.routes.js";

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);

export { io, app, server };
