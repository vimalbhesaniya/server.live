const mongoose = require("mongoose")
require("dotenv").config()
mongoose.connect(process.env.REACT_APP_MONGO, {dbName:"jobDuniya"}).then(console.log("database connected successfully"))
// mongoose.connect("mongodb://127.0.0.1:27017/admin").then(console.log("database connected successfully"))