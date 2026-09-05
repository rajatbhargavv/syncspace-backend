import app from "./app.js";
import { connectDb } from "./config/db.js";
import { PORT } from "./config/env.js";
async function startServer(){
try{
await connectDb()
app.listen(PORT,()=>{
    console.log("Server Started")
})
}catch(err){
    console.log("Server could not start",err);
}
}
startServer();