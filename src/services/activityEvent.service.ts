import ActivityEvent from "../models/ActivityEvent.model.js";
import { ICreateActivityEvent } from "../types/activityEvent.types.js";

export async function logActivityEvent(data: ICreateActivityEvent) {
    try {
        const event = new ActivityEvent(data);
        return await event.save();
    } catch (err) {
        console.error("Failed to log activity event:", err);
    }
}

