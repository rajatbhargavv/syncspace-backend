export type UserPlan = "FREE" | "PRO";

interface IUser {
    _id: string;
    name: string;
    email: string;
    password: string;
    isDeleted: boolean;
    plan: UserPlan;
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface IUpdateUser {
    name?: string;
    email?: string;
    password?: string;
    plan?: UserPlan;
}

export { IUser, IUpdateUser };
