import dotenv from "dotenv"
dotenv.config();
const SECRET_KEY=process.env.SECRET_KEY!;
if(!SECRET_KEY){
    throw new Error("SECRET_KEY is not defined")
}
export {SECRET_KEY};