import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: "*", credentials: true }));

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
app.set("trust proxy",1);

// http://localhost:8000/api
import authRouter from "./routes/auth.routes.js";
import messageRouter from "./routes/message.routes.js";


app.use("/api/auth",authRouter)
app.use("/api/message",messageRouter)

export { app };