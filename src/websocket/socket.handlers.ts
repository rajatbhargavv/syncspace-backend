import type {Server} from "socket.io"
export function registerSocketHandlers(io:Server){
    io.on("connection",(socket)=>{
        console.log(`Socket connected: ${socket.id}`)
        socket.on("disconnect",(reason)=>{
            console.log(`Socket disconnected: ${socket.id},reason: ${reason}`)
        })
    })
}