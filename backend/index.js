import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import {createClient} from 'redis';
import cookieParser from "cookie-parser"

dotenv.config();

await connectDB();

const redisUrl = process.env.REDIS_URL

if(!redisUrl){
    console.log("Missing redis url");
    process.exit(1);
}
export const redisClient = createClient({
    url: redisUrl,
})
redisClient.connect().then(() => console.log("connected to redis")).catch(console.error);

const app = express();

// middlewares 
app.use(express.json())
app.use(cookieParser())

// importing routes
import userRoutes from "./routes/user.js"

// using routes
app.use("/api/v1", userRoutes)

const PORT = process.env.PORT 


app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})