export interface IComment {
    _id: string;
    taskId: string;
    userId: string;
    content: string;
    edited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateComment {
    taskId: string;
    userId: string;
    content: string;
}

export interface IUpdateComment {
    _id: string;
    content: string;
}

