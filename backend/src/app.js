import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { ExpressPeerServer } from "peer";
import authRouter from "./routes/auth.routes.js";
import messageRouter from "./routes/message.routes.js";

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

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/",
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const roomMembers = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("joinRoom", ({ roomId, peerId }) => {
    socket.join(roomId);

    if (!roomMembers[roomId]) {
      roomMembers[roomId] = new Set();
    }
    roomMembers[roomId].add(peerId);

    socket.to(roomId).emit("userJoined", peerId);

    socket.on("disconnect", () => {
      if (userId) delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      if (roomMembers[roomId]) {
        roomMembers[roomId].delete(peerId);
        socket.to(roomId).emit("userLeft", peerId);
        if (roomMembers[roomId].size === 0) {
          delete roomMembers[roomId];
        }
      }
    });
  });

  socket.on("call-user", ({ to, from, roomId, peerId }) => {
  const receiverSocketId = userSocketMap[to];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("incoming-call", {
      from,
      roomId,
      peerId,
    });
  }
});
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/peerjs", peerServer);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.set("trust proxy", 1);

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);

export { io, app, server };
