import dotenv from "dotenv"
dotenv.config();
const port=process.env.PORT;
if(!port){
    throw new Error("PORT is not defined")
}
const PORT:string=port;
const accessSecretKey=process.env.SECRET_KEY_ACCESS;
const refreshSecretKey=process.env.SECRET_KEY_REFRESH;
if(!accessSecretKey){
    throw new Error("SECRET_KEY_ACCESS is not defined")
}
if(!refreshSecretKey){
    throw new Error("SECRET_KEY_REFRESH is not defined")
}

const SECRET_KEY_ACCESS:string=accessSecretKey
const SECRET_KEY_REFRESH:string=refreshSecretKey
const mongourl=process.env.MONGO_URL
if(!mongourl){
    throw new Error("MONGO_URL is not defined")
}
const MONGO_URL:string=mongourl
const nodeEnv=process.env.NODE_ENV
if(!nodeEnv){
    throw new Error("NODE_ENV is not defined")
}
const NODE_ENV:string=nodeEnv
export {SECRET_KEY_ACCESS,SECRET_KEY_REFRESH,PORT,MONGO_URL,NODE_ENV};