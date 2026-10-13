export interface IComments{
    _id: string,
    taskId: string,
    userId: string,
    content: string,
    edited: boolean,
    createdAt: Date,
    updatedAt: Date
}