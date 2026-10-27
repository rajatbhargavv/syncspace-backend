import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket.handlers.js";
let io:Server;
export function initializeSocket(httpServer:HttpServer){
    io=new Server(httpServer);
    registerSocketHandlers(io);
    return io;
}
export function getIo():Server{
    if(!io){
        throw new Error("Socket.Io not initialized");
    }
    return io;
}