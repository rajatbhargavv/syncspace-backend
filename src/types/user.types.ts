interface IUser {
    _id: string;
    name:string,
    email:string,
    password:string,
    refreshToken?:string
}
export {IUser}