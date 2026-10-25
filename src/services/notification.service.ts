import Notification from "../models/Notification.model.js";
import type {INotification} from "../types/notification.types.js";
import { getIo } from "../websocket/socket.server.js";
type NotificationData=Omit<INotification,"_id"|"recipientId"|"isRead"| "createdAt" | "updatedAt">
export async function createNotification(recipientIds:string[],data:NotificationData){
    if (recipientIds.length === 0) return [];
    const notificationObjects=[...new Set(recipientIds)].map((recipientId)=>{
        return(
            {
                recipientId,
                ...data
            }
        )
    })
    const savedNotifications=await Notification.insertMany(notificationObjects);
    const io=getIo();
    savedNotifications.forEach((not)=>{
        io.to(`user:${not.recipientId}`).emit("notification",not)
    })
    return savedNotifications;
}