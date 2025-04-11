import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", " PUT", "DELETE"],
        credentials: true,
    }
})

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

const userSocketMap = {}; 

io.on("connection", (socket) => {
  
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;
  
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  
    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", " PUT", "DELETE"],
    credentials: true
}));


app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
app.set("trust proxy", 1);

// http://localhost:8000/api
import authRouter from "./routes/auth.routes.js";
import messageRouter from "./routes/message.routes.js";


app.use("/api/auth", authRouter)
app.use("/api/messages", messageRouter)

export { io, app, server };
