import { MONGO_URL } from "./env.js";
import dns from "node:dns";
import mongoose from "mongoose";
async function connectDb(){
try{
    dns.setServers(["8.8.8.8"]);
    await mongoose.connect(MONGO_URL)
    console.log("Connected to Database successfully");
    }
catch(err){
    console.log("Database connection failed",err);
    throw err
}
}
export {connectDb};