require("./db")
const express = require("express");
const img = require("./model");
const multer = require("multer")
const cors = require("cors");
const app = express()
app.use(cors());
// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb'}));
const storage=multer.diskStorage({
    destination: "public/images",
    filename:(req,res,cb)=>{
        cb(null,res.originalname+".jpg")
    }
})

const upload=multer({
    storage:storage,
    // limits: { fileSize: 5 * 1024 * 1024 },y
}).single("image")

app.use(express.json())
app.get("/" ,     async (req , res ) =>{
    data.find().then((e) => {
        res.status(201).send(e)
    }).catch((e)=>res.status(404).send(e));
})


app.post("/upload" ,upload ,async (req , res) => {
   const imgObj = new img(req.body);
   img.insertMany(imgObj).then(()=>{
       res.status(200).send(imgObj);
   })   
   
})
 
app.listen(5500, () => console.log("server started..."))

