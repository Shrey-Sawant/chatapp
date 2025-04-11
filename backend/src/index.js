import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { server } from "./app.js";

dotenv.config();

connectDB()
    .then(() => {
        server.listen(8001, () => {
            console.log("Connected!!!")
        })
    })
    .catch((err) => {
        console.log("Failed !!!")
    })