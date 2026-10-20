interface IUser {
    _id: string;
    name:string,
    email:string,
    password:string,
    isDeleted:boolean,
    refreshToken?:string
}
interface IUpdateUser {
    name? :string,
    email? :string,
    password? :string
}
export {IUser,IUpdateUser}