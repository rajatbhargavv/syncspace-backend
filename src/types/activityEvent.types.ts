export interface IActivityEvent {
    _id: string;
    spaceId: string;
    taskId?: string;
    actorId: string;
    type: string;
    meta?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateActivityEvent {
    spaceId: string;
    taskId?: string;
    actorId: string;
    type: string;
    meta?: Record<string, any>;
}

