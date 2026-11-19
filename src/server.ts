import { createServer } from "node:http";
import app from "./app.js";
import { connectDb } from "./config/db.js";
import { PORT } from "./config/env.js";
import { initializeSocket } from "./websocket/socket.server.js";
async function startServer(){
try{
await connectDb()
const httpServer=createServer(app);
initializeSocket(httpServer)
httpServer.listen(Number(PORT), "0.0.0.0", ()=>{
    console.log("Server Started")
})
}catch(err){
    console.log("Server could not start",err);
}
}
startServer();