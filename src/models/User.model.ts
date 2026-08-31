import {Schema,model} from "mongoose"
import IUser from "../types/user.types";
 const userSchema=new Schema<IUser>({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        select:false
    }
 },{timestamps:true});
 const User=model("User",userSchema);
export default User;