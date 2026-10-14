interface IUser {
    _id: string;
    name:string,
    email:string,
    password:string,
    refreshToken?:string
}
interface IUpdateUser {
    name? :string,
    email? :string,
    password? :string
}
export {IUser,IUpdateUser}