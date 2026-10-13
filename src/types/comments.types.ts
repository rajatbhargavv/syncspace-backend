export interface IComments{
    _id: string,
    taskId: string,
    userId: string,
    content: string,
    edited: boolean,
    createdAt: Date,
    updatedAt: Date
}

export interface IUpdateComments{
    _id: string,
    content: string,
}