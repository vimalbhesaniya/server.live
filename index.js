require("./db");
const express = require("express");
const {
  User,
  Address,
  Education,
  WorkExperience,
  CompanyConnections,
  Company,
  JobPost,
  UserFollow,
  SavedJob,
  Connection,
  JobApplications,
} = require("./model");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const key = process.env.JWT_SECRET;
const encrypt = require("bcrypt");
const crypto = require("crypto");
const { SendMailToApplicient } = require("./mailServices");
const { log, error } = require("console");
// const multer = require("multer");

//
app.use(cors());
app.use(express.json());

// app.use(cors({
//     origin: 'https://jobduniya-live.vercel.app/',
//     optionsSuccessStatus: 200,
//     credentials: true
// }));
// app.use(cors({
//     origin: 'https://jobduniya-live.vercel.app/*',
//     optionsSuccessStatus: 200,
//     credentials: true
// }));

function generateOTP(length = 6) {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  const OTP = buffer.toString("hex").slice(0, length);
  return OTP;
}

// const handleFileUpload = (event) => {
//     const selectedFile = event;
//     if (selectedFile) {
//         const storageRef = firebase.storage().ref();
//         const fileRef = storageRef.child(selectedFile.name)

//         fileRef.put(selectedFile).then((snapshot) => {
//             snapshot.ref.getDownloadURL().then((downloadURL) => {
//                 console.log(downloadURL);
//                 return downloadURL;
//             })
//         })
//     } else {
//         console.log("No File Selected, soo Select One!");
//     }
// }

// admin.initializeApp({
//     // credential: admin.credential.cert(serviceAccount),
//     storageBucket: "jobduniya-13f13.appspot.com"
// });

//   const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// app.post('/upload', async (req, res) => {
//     try {
//         // Check if req.body contains any data
//         if (req.body && Object.keys(req.body).length > 0) {
//             console.log('File posted:', req.body);
//             res.send('File uploaded successfully.');
//         } else {
//             console.log('No file posted.');
//             res.status(400).send('No file uploaded.');
//         }
//     } catch (error) {
//         console.error('Error uploading logo:', error);
//         return res.status(500).send('Error uploading logo.');
//     }
// });
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jobduniya.inc@gmail.com",
    pass: "jkxj quzq ghis gico",
  },
});

app.post("/EmailSend", async (req, res) => {
  try {
    const { recipient, subject, message } = req.body; // Extract email data from request body

    const mailOptions = {
      from: "vimalbhesaniya007@gmail.com",
      to: recipient,
      subject: subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(info);
    res.send({ message: "Email sent successfully!", data: null });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email", error: true });
  }
});

// Login Authentication api
app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    const email = req.body.email;
    res.setHeader("Access-Control-Allow-Origin", "*");
    const data = await User.findOne({ email: email });
    if (data) {
      const pwdMatch = await encrypt.compare(req.body.password, data.password);
      if (pwdMatch) {
        jwt.sign({ data }, key, { expiresIn: "1d" }, (err, token) => {
          err
            ? res.send({ message: err.message, error: true })
            : res.send({
                data,
                token: token,
                id: data._id,
                message: "Login Successfully",
              });
        });
      } else {
        res.status(404).send({ message: "Invalid Credentials", error: true });
      }
    } else {
      res.status(404).send({ message: "User not found", error: true });
    }
  } else {
    res
      .status(500)
      .send({ message: "Provide Email and password", error: true });
    if (req.body.password && req.body.email) {
      let data = await User.findOne(req.body).select("-password");
      if (data) {
        jwt.sign({ data }, key, { expiresIn: "1d" }, (err, token) => {
          err
            ? res.send({ message: err.message, error: true })
            : res.send({ data, token: token, message: "Login Successfully" });
        });
      } else {
        res.send({ result: "User  not found" });
      }
    }
  }
});

// get all users
const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  console.warn("called ", token);
  if (token) {
    jwt.verify(token, key, (err, valid) => {
      err
        ? res
            .status(401)
            .send({ error: "Authentication Faild", message: "Invalid Token" })
        : next();
    });
  } else {
    res.send({ message: "provide a token from headers", error: true });
  }
};

app.get("/users", verifyToken, async (req, res) => {
  const { limit, skip } = req.query;
  const users = await User.find().select("-password").limit(limit).skip(skip);
  res.send({ data: users, message: "Users Listed Successfully" });
});

app.get("/", async (req, res) => {
  res.send("Welcome to jobDuniya");
});

app.get("/profile/:ID", verifyToken, async (req, res) => {
  try {
    const id = req.params.ID;
    const user = await User.findOne({ _id: id }).select("-password");
    res.send({ data: user, message: "User fetched Successfully" });
  } catch (e) {
    res.send({ message: "Failed to fetch user", error: e });
  }
});

app.get("/company/:ID", verifyToken, async (req, res) => {
  try {
    const id = req.params.ID;
    const company = await Company.find({ _id: id }).select("-password");
    res.send({ data: company, message: "Company fetched Successfully" });
  } catch (e) {
    res.send({ message: "Failed to fetch company", error: e });
  }
});

app.get("/checkisvalid", verifyToken, async (req, res) => {
  res.send({ authorized: "You are Authorized" });
});

// user registration api
app.post("/addUser", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  req.body.password = await encrypt.hash(req.body.password, 10);
  const email = req.body.email;
  const user = await User.find({ email: email });
  if (user.length) {
    res.status(500).send({
      message: "Email is alerady exits",
      error: true,
    });
  } else {
    const finaldata = new User(req.body);
    User.insertMany(finaldata)
      .then((e) => {
        res
          .status(201)
          .send({ message: "User Added Successfully", _id: e[0]._id });
      })
      .catch((e) => {
        res.status(400).send({ message: "Failed to add user", error: e });
      });
  }
});

app.post("/Apply", async (req, res) => {
  try {
    const finaldata = new JobApplications(req.body);

    res.setHeader("Access-Control-Allow-Origin", "*");
    JobApplications.insertMany(finaldata)
      .then((e) => {
        res.status(201).send({
          message: "Your application has been applied Successfully",
          _id: e[0]._id,
        });
      })
      .catch((e) => {
        res
          .status(400)
          .send({ message: "Failed to submit your application", error: e });
      });
  } catch (e) {
    res.status(500).send({ message: "Something went wrong", error: e });
  }
});

app.post("/addCompany", async (req, res) => {
  req.body.Password = await encrypt.hash(req.body.Password, 10);
  const email = req.body.Email;
  res.setHeader("Access-Control-Allow-Origin", "*");
  const company = await Company.find({ Email: email });
  if (company.length) {
    res.send({
      error: true,
      message: "Email ID is alerady exits, PLease Enter Unique Id",
    });
  } else {
    const finaldata = new Company(req.body);
    Company.insertMany(finaldata)
      .then((e) => {
        res
          .status(201)
          .send({ message: "Company created Successfully", _id: e[0]._id });
      })
      .catch((e) => {
        res.status(400).send({ error: e, message: "Failed to add company" });
      });
  }
});

app.post("/addJob", async (req, res) => {
  const finaldata = new JobPost(req.body);
  res.setHeader("Access-Control-Allow-Origin", "*");
  JobPost.insertMany(finaldata)
    .then((e) => {
      res
        .status(201)
        .send({ message: "Job Created a Successfully", _id: e[0]._id });
    })
    .catch((e) => {
      res.status(400).send({ error: e, message: "Failed to add job" });
    });
});

// app.put("/personaldetail", async (req, res) => {
//     // const finaldata = new data(req.body);
//     const list = await User.find({ "_id": "65cc6967cdc9223fc6e2de04" });
//     if (list) {
//         await User.updateOne(
//             { "_id": "65cc6967cdc9223fc6e2de04" },
//             { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName } }
//         )
//         res.send({ success: true, message: "Updated data" });
//     } else {
//         res.send({ success: false, message: "Data Not Found" })
//     }
// })
// app.put("/Otherdetail", async (req, res) => {
//     // const finaldata = new data(req.body);
//     const list = await User.find({ "_id": "65cc6967cdc9223fc6e2de04" });
//     if (list) {
//         await User.updateOne(
//             { "_id": "65cc6967cdc9223fc6e2de04" },
//             { $set: { "langauges": req.body.langauges, "skills": req.body.skills, "profession": req.body.profession } }
//         )
//         res.send({ success: true, message: "Updated data" });
//     } else {
//         res.send({ success: false, message: "Data Not Found" })
//     }
// })
// app.post("/address", async (req, res) => {
//     // const list=await Address.
//     // const finaldata=new Address(req.body);
//     // Address.insertMany(finaldata).then((e)=>{
//     //     res.status(201).send(e);
//     // }).catch((e)=>{
//     //     res.status(404).send(e);
//     // })
// })
// app.post("/Education", async (req, res) => {
//     const finaldata = new Education(req.body);
//     Education.insertMany(finaldata).then((e) => {
//         res.status(201).send(e);
//     }).catch((e) => {
//         res.status(404).send(e);
//     })
// })
// app.post("/WorkExperience", async (req, res) => {
//     const finaldata = new WorkExperience(req.body);
//     WorkExperience.insertMany(finaldata).then((e) => {
//         res.status(201).send(e);
//     }).catch((e) => {
//         res.status(404).send(e);
//     })
// })
// app.get("/search",async(req,res) => {
//     const srch=req.body.srch;
//     const tablename=req.body.tablename;
//     const Model = mongoose.model(tablename);
//     if(srch){
//         const list=await Model.find({$or:[{"email":{$regex: new RegExp(srch, 'i')}},{"firstName":{$regex: new RegExp(srch, 'i')}},{"lastName":{$regex: new RegExp(srch, 'i')}}]});
//         res.send(list);
//     }else{
//         res.send("Data ot found");
//     }
// })

// Update api
app.patch("/updateDetails", async (req, res) => {
  try {
    const tablename = req.body.COLLECTION_NAME;
    if (!tablename) {
      return res.status(400).send("Table name not provided");
    }
    const Model = mongoose.model(tablename);

    console.log("call--Model", Model);

    if (!Model) {
      return res.status(404).send({ message: "Model not found", error: true });
    }
    const { _id, COLUMNS } = req.body;

    if (!_id) {
      return res
        .status(400)
        .send({ message: "Document ID not provided", error: true });
    }

    if (tablename !== "userFollow" && tablename !== "companyConnections") {
      const updatedDocument = await Model.findByIdAndUpdate(
        _id,
        { $set: COLUMNS },
        { new: true }
      );
      if (updatedDocument) {
        console.log(updatedDocument);
        return res.send({
          message: "Data updated successfully",
          data: updatedDocument,
        });
      } else {
        return res
          .status(404)
          .send({ message: "Document not found", error: true });
      }
    } else {
      const updatedDocument = await Model.findOneAndUpdate(
        _id,
        { $addToSet: { targetId: COLUMNS.targetId } },
        { new: true }
      );

      if (updatedDocument) {
        return res.send({
          message: "Data updated successfully",
          data: updatedDocument,
        });
      } else {
        return res
          .status(404)
          .send({ message: "Document not found", error: true });
      }
    }
  } catch (error) {
    console.log("call--error", error);

    return res
      .status(500)
      .send({ message: "Internal Server Error", error: JSON.stringify(error) });
  }
});

app.get("/fetchJobs/:keyword", async (req, res) => {
  const keyword = req.params.keyword;
  const jobs = await JobPost.find({ JobType: keyword });
  if (jobs) {
    res.status(200).send({ data: jobs, message: "Job fetched successfully" });
  } else {
    res.status(404).send("jobs are not Found");
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const { title, id } = req.query;
    let query = {};
    if (title) {
      query.Title = { $regex: title, $options: "i" };
    }
    if (id) {
      query._id = id;
    }
    const jobs = await JobPost.find(query);
    res.json({ data: jobs, message: "Jobs fetched successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err, message: "Internal Server Error" });
  }
});

app.get("/search", async (req, res) => {
  try {
    const tablename = req.query.tbl;
    if (!tablename) {
      return res
        .status(400)
        .send({ message: "Table name not provided", error: true });
    }
    const Model = mongoose.model(tablename);
    if (!Model) {
      return res.status(404).send({ message: "Modal not found", error: true });
    }
    const keyword = req.query.keyword;
    const location = req.query.location;
    let query = {};
    if (keyword) {
      query.Title = { $regex: keyword, $options: "i" };
    }
    if (location) {
      const locationRegex = new RegExp(location.replace(/ /g, "|"), "i");
      query["$or"] = [
        { "company.Address.city": { $regex: locationRegex } },
        { "company.Address.state": { $regex: locationRegex } },
        { "company.Address.location": { $regex: locationRegex } }, // Include 'location' field if you have one
      ];
    }
    if (tablename === "jobs") {
      const jobs = await Model.aggregate([
        {
          $lookup: {
            from: "companies",
            localField: "company",
            foreignField: "_id",
            as: "company",
          },
        },
        {
          $match: query,
        },
      ]);
      res.json({ data: jobs, message: "Jobs fetched successfully" });
    } else {
      const schema = Model.schema.paths;
      const orQuery = Object.keys(schema)
        .filter((key) => schema[key].instance === "String")
        .map((key) => ({
          [key]: { $regex: new RegExp(keyword, "i") },
        }));

      if (orQuery.length === 0) {
        return res.status(400).send({
          message: "No searchable string fields in the schema",
          error: true,
        });
      }
      const list = await Model.find({ $or: orQuery });
      res.send({ data: list, message: "Data fetched successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Data Listing api
app.get("/fetchall/:tbl/:limit/:skip", async (req, res) => {
  const tablename = req.params.tbl;
  if (!tablename) {
    return res
      .status(400)
      .send({ message: "Table name not provided", error: true });
  }
  const Model = mongoose.model(tablename);
  if (!Model) {
    return res.status(404).send("Model not found");
  } else {
    const list = await Model.find(req.body.where)
      .limit(req.params.limit)
      .skip(req.params.skip);
    res.status(201).send({ data: list, message: "Data fetched successfully" });
  }
});

app.get("/fetchConnectedCompany/:id", async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    res.send({ error: true, message: "Please Enter Both Id1 and Id2" });
  } else {
    const list = await CompanyConnections.find({ userId: userId });
    if (list) {
      res.send({ data: list, message: "Company fetched successfully" });
    } else {
      res.send({ data: [], message: "No company foun" });
    }
  }
});
// company registration api
app.post("/Insert/:tbl", async (req, res) => {
  const tablename = req.params.tbl;
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!tablename) {
    return res.status(400).send("Table name not provided");
  }
  const Model = mongoose.model(tablename);
  if (!Model) {
    return res.status(404).send("Model not found");
  }
  const finaldata = new Model(req.body);
  Model.insertMany(finaldata)
    .then((e) => {
      res.status(201).send(e);
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

// app.delete("/delete", async (req, res) => {
//     try {
//         const where = req.body.where;
//         const tablename = req.body.tbl;
//         if (!tablename) {
//             return res.status(400).send("Table name not provided");
//         }
//         const Model = mongoose.model(tablename);
//         if (!Model) {
//             return res.status(404).send("Model not found");
//         }
//         // await ConnectDB();
//         const data = await Model.findOneAndDelete(where);
//         if (data) {
//             res.status(411).json({
//                 res: "ok",
//                 msg: "Data Deleted Successfully",
//                 data:data
//             });
//         } else {
//             res.status(400).json({
//                 res: "error",
//                 msg: "Data not Deleted",
//             });
//         }
//     } catch (error) {
//         res.status(411).json({
//             res: "Error",
//             msg: "Invalid Input Types",
//             error: error,
//         });
//     }
// });

// app.post('/jobPost', async (req, res) => {
//     const tablename = req.body.tablename;
//     if (!tablename) {
//         return res.status(400).send("Table name not provided");
//     }
//     const Model = mongoose.model(tablename);
//     if (!Model) {
//         return res.status(404).send("Model not found");
//     }
//     const finaldata = new Model(req.body);
//     Model.insertMany(finaldata).then((e) => {
//         res.status(201).send(e);
//     }).catch((e) => {
//         res.status(400).send(e);
//     })
// })

app.post("/savedJob", async (req, res) => {
  const UserID = req.body.userId;
  res.setHeader("Access-Control-Allow-Origin", "*");
  const JobID = req.body.jobId;
  console.log(req.body);
  if (!UserID || !JobID) {
    return res
      .status(400)
      .send({ message: "User Id and Job Id are not provided", error: true });
  } else {
    const finaldata = new SavedJob(req.body);
    SavedJob.insertMany(finaldata)
      .then((e) => {
        res.status(201).send({ data: e, message: "Job Saved Successfully" });
      })
      .catch((e) => {
        res.status(400).send({ error: e, message: "Failed to save job" });
      });
  }
});

app.post("/deleteSaveJob", async (req, res) => {
  const ID = req.body.id;
  res.setHeader("Access-Control-Allow-Origin", "*");
  SavedJob.deleteOne({ _id: ID })
    .then((e) => {
      res.status(201).send({ data: e, message: "Job Deleted Successfully" });
    })
    .catch((e) => {
      res.status(400).send({ error: e, message: "Failed to delete job" });
    });
});

app.get("/ListJob/:id", async (req, res) => {
  const list = await SavedJob.find({
    userId: req.params.id,
  });
  if (list) {
    res.send({ data: list, message: "Saved Jobs fetched successfully" });
  } else {
    res.send("Not Found Saved Jobs");
  }
});

app.get("/fetchAppliedJobs/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const list = await JobApplications.find({ userId: id });

    console.log('call--list', list);

    res.send({ data: list, message: "Applied Jobs fetched successfully" });
  } catch (e) {
    res.send(e);
  }
});

// app.post("/Follow", async (req, res) => {
//   const userid = req.body.userId;
//   const companyid = req.body.companyId;
//   if (!userid || !companyid) {
//     return res.status(400).send("User Id and Comapny Id are not provided");
//   } else {
//     const finaldata = new Connection(req.body);
//     Connection.insertMany(finaldata)
//       .then((e) => {
//         res.status(201).send(e);
//       })
//       .catch((e) => {
//         res.status(400).send(e);
//       });
//   }
// });

app.post("/connectTocompany", async (req, res) => {
  const userid = req.body.userId;
  const companyid = req.body.companyId;
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!userid || !companyid) {
    return res.status(400).send("User Id and Comapny Id are not provided");
  } else {
    const finaldata = new Connection(req.body);
    Connection.insertMany(finaldata)
      .then((e) => {
        res.status(201).send({ data: e, message: "Connected Successfully" });
      })
      .catch((e) => {
        res.status(400).send({ error: e, message: "Failed to connect" });
      });
  }
});

app.post("/followTouser", async (req, res) => {
  const finaldata = new UserFollow(req.body);
  res.setHeader("Access-Control-Allow-Origin", "*");
  UserFollow.insertMany(finaldata)
    .then((e) => {
      res
        .status(201)
        .send({ message: e, message: "User followed successfully" });
    })
    .catch((e) => {
      res.status(400).send({ error: e, message: "Failed to follow user" });
    });
});

// app.get("/Listing", async (req, res) => {
//     const tablename = req.body.tablename;
//     if (!tablename) {
//         return res.status(400).send("Table name not provided");
//     }
//     const Model = mongoose.model(tablename);
//     if (!Model) {
//         return res.status(404).send("Model not found");
//     }
//     else {
//         // res.send(req.body.where);
//         const id=[];
//         const list = await Model.find(req.body.where);
//         if(req.body.where==="Comapny_ID") {
//             id.push(list.User_ID);
//         }
//         else{
//             id.push(list.Company_ID);
//         }
//         res.status(201).send(id);
//     }
// })

app.get("/UserListing", async (req, res) => {
  const companyId = req.body.companyId;
  // res.send(companyId);
  if (!companyId) {
    return res.status(400).send("Company ID not provided");
  }
  try {
    // Find connections for the given companyID
    const connections = await Connection.find({ companyId: companyId });

    // Extract user IDs from connections
    const userIDs = connections.map((connection) => connection.userId);

    // Find users who have followed the given company
    const users = await User.find({ _id: { $in: userIDs } });

    res
      .status(200)
      .send({ data: users, message: "Users fetched successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Failed to fetch users", error });
  }
});

app.get("/CompanyListing", async (req, res) => {
  const userId = req.body.userId;
  // res.send(companyId);
  if (!userId) {
    return res
      .status(400)
      .send({ message: "User ID not provided", error: true });
  }
  try {
    // Find connections for the given companyID
    const connections = await Connection.find({ userId: userId });

    // Extract user IDs from connections
    const companyIDs = connections.map((connection) => connection.userId);

    // Find users who have followed the given company
    const company = await Company.find({ _id: { $in: companyIDs } });

    res
      .status(200)
      .send({ data: company, message: "Company fetched successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});
app.post("/Clogin", async (req, res) => {
  try {
    if (req.body.password && req.body.email) {
      const email = req.body.email;
      res.setHeader("Access-Control-Allow-Origin", "*");
      const data = await Company.findOne({ Email: email });
      console.log(data);
      if (data) {
        const pwdMatch = await encrypt.compare(
          req.body.password,
          data.Password
        );
        if (pwdMatch) {
          jwt.sign({ data }, key, { expiresIn: "1d" }, (err, token) => {
            err
              ? res.send({
                  message: "something went wrong",
                  error: err.message,
                })
              : res.send({
                  data,
                  token: token,
                  id: data._id,
                  message: "Login Successfully",
                });
          });
        } else {
          res.status(404).send({ message: "Password incorrect", error: true });
        }
      } else {
        res.status(404).send({ message: "Company is not exist", error: true });
      }
    } else {
      res.status(400).send({ message: "Something went wrong", error: true });
    }
  } catch (e) {
    res.send(e);
  }
});

app.post("/forgot", async (req, res) => {
  const oneTimeOTP = generateOTP();
  res.setHeader("Access-Control-Allow-Origin", "*");
  const to = req.body.email;
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    await User.updateOne(
      { email: req.body.email },
      { $set: { secretKey: oneTimeOTP } }
    );
    const subject = " Password Reset Verification Code";
    const html =
      "<p>dear ,</p>" +
      req.body.email +
      "<p>You have requested to change password of your account. Please use the following One-Time Password (OTP) to proceed:</p><p>OTP: <b>" +
      oneTimeOTP +
      "</b><p>This OTP is valid for a limited time only. Do not share this OTP with anyone for security reasons.</p>" +
      "<p><b>Thank you for choosing JobDuniya!,</b></p><p><b>regards ,<br/> jobDuniya & Team</b></p>";

    const result = await SendMailToApplicient(to, subject, html);
    console.log(result);
    res.send({ message: "Check your mail", result });
  } else {
    res.send({ error: true, message: "user not found" });
  }
});

app.post("/SendMailToApplicient", async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const to = req.body.recipientEmail;
    const subject = req.body.subject;
    const html = req.body.message;
    const result = SendMailTo(to, subject, html);
    res.send({ status: true, result });
  } catch (e) {
    res.send(e);
  }
});

app.post("/checkOTP", async (req, res) => {
  const ConOTP = req.body.otp;
  res.setHeader("Access-Control-Allow-Origin", "*");
  const user = await User.findOne({ email: req.body.email });
  // res.send(user)
  if (ConOTP === user.secretKey) {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
});

app.patch("/changePwd", async (req, res) => {
  try {
    if (req.body.password && req.body.email) {
      req.body.password = await encrypt.hash(req.body.password, 10);
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        await User.updateOne(
          { email: req.body.email },
          { $set: { password: req.body.password, secretKey: "" } }
        );
        res.send({ success: true });
      } else {
        res.send({ success: false, message: "User Not Found" });
      }
    } else {
      res.send({ success: false, message: "Not get data in body" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

app.post("/verify", async (req, res) => {
  const ConOTP = req.body.otp;
  const email = req.body.email;
  res.setHeader("Access-Control-Allow-Origin", "*");
  const company = await Company.findOne({
    Email_ID: req.body.email,
    secretKey: req.body.otp,
  });
  // res.send(user)
  if (company) {
    jwt.sign({ company }, key, { expiresIn: "1d" }, async (err, token) => {
      err
        ? res.send("something went wrong")
        : await Company.updateOne(
            { Email_ID: req.body.email },
            { $set: { secretKey: "" } }
          );
      res.send({ company, token: token, id: company._id });
    });
  } else {
    res.send({ result: "Company not found" });
  }
});

app.post("/FileUpload", async (req, res) => {
  const file = req.body.file;
  res.send(file);
  res.setHeader("Access-Control-Allow-Origin", "*");
  // handleFileUpload(file);
});

app.post("/userWhoPerformFollow", async (req, res) => {
  const id = req.body.userId;
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!id) {
    return res.status(400).send("User Id and Job Id are not provided");
  } else {
    const finaldata = new UserFollow(req.body);
    UserFollow.insertMany(finaldata)
      .then((e) => {
        res.status(201).send(e);
      })
      .catch((e) => {
        res.status(400).send(e);
      });
  }
});
app.post("/userWhoPerformFollowToCompany", async (req, res) => {
  const id = req.body.userId;
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!id) {
    return res.status(400).send("User Id and Job Id are not provided");
  } else {
    const finaldata = new CompanyConnections(req.body);
    CompanyConnections.insertMany(finaldata)
      .then((e) => {
        res.status(201).send(e);
      })
      .catch((e) => {
        res.status(400).send(e);
      });
  }
});

app.get("/myFollowers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const users = await UserFollow.find({ userId: id });
    console.log(users);
    if (users) {
      res.send(users);
    } else {
      res.send({ message: "No Users Found" });
    }
  } catch (e) {
    res.send(e);
  }
});

app.get("/notFollowed/:userId/:limit", async (req, res) => {
  try {
    const { userId, limit } = req.params; // Assuming you have authenticated the user and have access to user's ID

    // Find all users who are not followed by the current user
    const usersNotFollowed = await UserFollow.findOne({ userId: userId });
    if (usersNotFollowed) {
      const users = await User.find({
        $and: [
          { _id: { $ne: userId } },
          { _id: { $nin: usersNotFollowed.targetId } },
        ],
      }).limit(limit);
      res.send(users);
    } else {
      res.send({ message: "user not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/notFollowedCompany/:userId/:limit", async (req, res) => {
  try {
    const { userId, limit } = req.params;

    const usersNotFollowed = await CompanyConnections.findOne({
      userId: userId,
    });
    if (usersNotFollowed) {
      const users = await Company.find({
        $and: [
          { _id: { $ne: userId } },
          { _id: { $nin: usersNotFollowed.targetId } },
        ],
      }).limit(limit);
      res.send(users);
    } else {
      res.send({ message: "user not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/getFollowings/:id", async (req, res) => {
  try {
    const users = await UserFollow.findOne({ userId: req.params.id });
    if (users.length !== 0) {
      res.send({ data: users, message: "Users fetched successfully" });
    } else {
      res.send({ message: "Users not found" });
    }
  } catch (e) {
    res.send(e);
  }
});

app.patch("/api/userfollow/:userId/remove/:targetId", async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    // Find the userFollow document for the userId
    const userFollow = await UserFollow.findOne({ userId });

    // If userFollow document doesn't exist, return error
    if (!userFollow) {
      return res.status(404).json({ message: "User follow not found" });
    }

    // Remove the targetId from the targetIds array
    const result = await UserFollow.findOneAndUpdate(
      { userId: userId },
      { $pull: { targetId: targetId } }
    );

    return res
      .status(200)
      .json({ message: "TargetId removed successfully", result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
app.patch("/api/companyfollow/:userId/remove/:targetId", async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    // Find the userFollow document for the userId
    const userFollow = await CompanyConnections.findOne({ userId });

    // If userFollow document doesn't exist, return error
    if (!userFollow) {
      return res.status(404).json({ message: "User follow not found" });
    }

    // Remove the targetId from the targetIds array
    const result = await UserFollow.findOneAndUpdate(
      { userId: userId },
      { $pull: { targetId: targetId } }
    );

    return res
      .status(200)
      .json({ message: "TargetId removed successfully", result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
app.delete("/delete", async (req, res) => {
  try {
    console.log(req.body);
    const where = req.body.WHERE;
    console.log(where);
    const tablename = req.body.COLLECTION_NAME;
    if (!tablename) {
      return res.status(400).send("Table name not provided");
    }
    const Model = mongoose.model(tablename);
    if (!Model) {
      return res.status(404).send("Model not found");
    }
    // await ConnectDB();
    const data = await Model.deleteOne({ _id: where });
    if (data) {
      res.status(200).json({
        res: "ok",
        msg: "Data Deleted Successfully",
        data: data,
      });
    } else {
      res.status(400).json({
        res: "error",
        msg: "Data not Deleted",
        data: data,
      });
    }
  } catch (error) {
    res.status(411).json({
      res: "Error",
      msg: "Invalid Input Types",
      error: error,
    });
  }
});

app.get("/authenitcation", verifyToken, (req, res) => {
  res.send({
    status: true,
  });
});
app.listen(5500, () => console.log("server started..."));

app.get("/getFollowers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const users = await UserFollow.find({ targetId: { $in: id } });
    if (users && users.length > 0) {
      const userIds = users.map((user) => user.userId);
      const followersData = await User.find({ _id: { $in: userIds } });

      if (followersData && followersData.length > 0) {
        res.send(followersData);
      } else {
        res.send({ message: "Data Not Found" });
      }
    } else {
      res.send({ message: "No Followers Found for the specified user" });
    }
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/getConnections/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const users = await CompanyConnections.find({ targetId: { $in: id } });
    if (users && users.length > 0) {
      const userIds = users.map((user) => user.userId);
      const connectionsData = await User.find({ _id: { $in: userIds } });

      if (connectionsData && connectionsData.length > 0) {
        res.send(connectionsData);
      } else {
        res.send({ message: "Data Not Found" });
      }
    } else {
      res.send({ message: "No Followers Found for the specified user" });
    }
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.get("/applied-users/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    // Use aggregation to find userIds who applied for jobs for the given company
    const appliedUsers = await JobApplications.find({ cId: companyId });
    res.json(appliedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/FetchCompanyJobs/:id", async (req, res) => {
  try {
    const result = await JobPost.find({ company: req.params.id });
    res.send(result);
  } catch (e) {
    res.send(e);
  }
});

app.get("/filter/jobs", async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const jobs = await JobPost.find({
      $or: [
        //   { company  : { Address : [{ city: {$regex: filter, $options: "i" }}]} },
        { JobType: { $regex: filter, $options: "i" } },
        //   { name: { $regex: filter, $options: "i" } },
      ],
    });
    res.status(200).json({
      res: "ok",
      msg: "All jobs Fetch Successfully",
      jobs: jobs,
    });
  } catch (error) {
    res.status(411).json({
      res: "ERROR",
      msg: "Something went wrong",
      error: error,
    });
  }
});

app.get("/filter/user", async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const jobs = await User.find({
      $or: [
        //   { company  : { Address : [{ city: {$regex: filter, $options: "i" }}]} },
        { firstName: { $regex: filter, $options: "i" } },
        { lastName: { $regex: filter, $options: "i" } },
        //   { name: { $regex: filter, $options: "i" } },
      ],
    });
    res.status(200).json({
      message: "All jobs Fetch Successfully",
      data: jobs,
    });
  } catch (error) {
    res.status(411).json({
      message: "Something went wrong",
      error: error,
    });
  }
});

app.listen(5600, () => console.log("server started..."));

module.exports = app;
