// require('dotenv').config({path: './env'})  //used to config dotenv file

import { configDotenv } from "dotenv"; // for use of this we do changes in package.json 
import connectDB from "./db/database.js";
import { app } from "./app.js";

configDotenv({
    path: './env'
})

connectDB()
    .then(() => {
        // Also we include app.on for error listen.
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })





//One of the approach is used to link db and listing the port.
/*
import express from "express";
import { DB_NAME } from "./constants";

const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("ERROR: ",error)
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERR : ",error);
        throw error
    }
})()
*/