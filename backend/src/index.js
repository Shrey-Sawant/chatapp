import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app, server } from "./app.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

dotenv.config();

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

connectDB()
    .then(() => {
        server.listen(8000, () => {
            console.log("Connected!!!")
        })
    })
    .catch((err) => {
        console.log("Failed !!!")
    })