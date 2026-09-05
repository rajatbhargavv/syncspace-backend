import dotenv from "dotenv"
dotenv.config();
const port=process.env.PORT;
if(!port){
    throw new Error("PORT is not defined")
}
const PORT:string=port;
const secretKey=process.env.SECRET_KEY;
if(!secretKey){
    throw new Error("SECRET_KEY is not defined")
}
const SECRET_KEY:string=secretKey
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
export {SECRET_KEY,PORT,MONGO_URL,NODE_ENV};