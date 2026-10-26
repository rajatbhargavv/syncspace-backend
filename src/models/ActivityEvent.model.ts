import { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { IActivityEvent } from "../types/activityEvent.types.js";

const activityEventSchema = new Schema<IActivityEvent>(
    {
        _id: {
            type: String,
            default: () => "Event_" + randomUUID(),
        },
        spaceId: {
            type: String,
            ref: "Space",
            required: true,
        },
        taskId: {
            type: String,
            ref: "Task",
            required: false,
        },
        actorId: {
            type: String,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        meta: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

activityEventSchema.index({ taskId: 1, createdAt: 1 });
activityEventSchema.index({ spaceId: 1, createdAt: -1 });

const ActivityEvent = model<IActivityEvent>("ActivityEvent", activityEventSchema);

export default ActivityEvent;

