const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
    personalAddress: {
        type: String,
        required: false
    },
    pinCode: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
});

const EducationSchema = new mongoose.Schema({
    univercity: {
        type: String
    },
    school: {
        type: String
    },
    institutionName: {
        type: String,
        required: false
    },
    degreeLevel: [String],
    startDateSchool: {
        type: Date,
        required: false
    },
    endDateSchool: {
        type: Date,
        required: false
    },
    gpa: {
        type: String,
        required: false
    },
    certifications: [{
        type: String,
        required: false
    }]
});

const WorkExperienceSchema = new mongoose.Schema({
    isFresher: { type: Boolean, default: true },
    userType: {
        type: String,
        required: false
    },
    jobTitle: {
        type: String,
    },
    companyName: {
        type: String,
    },
    startDateWork: {
        type: Date
    },
    endDateWork: {
        type: Date
    },
    responsibilities: [String],
    achievements: [String],
});

const UserSchema = new mongoose.Schema({
    privat: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
    },
    password: {
        type: String
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    profileImage: {
        type: String,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    langauges: {
        type: [String],
    },
    cv: {
        type: String
    },
    skills: {
        type: [String],
    },
    profession: {
        type: String,
    },
    secretKey: {
        type: String
    },
    description: {
        type: String
    },
    location: [AddressSchema],
    education: [EducationSchema],
    experience: [WorkExperienceSchema]
});

const CompanySchema = new mongoose.Schema({
    isProfileComplete : {type : Boolean , default : false} , 
    Name: { type: String, required: false },
    Address: [AddressSchema],
    Industry: { type: String },
    Email: { type: String, required: false },
    Password: { type: String },
    Logo: { type: String, required: false },
    TagLine: { type: String, required: false },
    Websites: { type: [String] },
    establishedYear: { type: String, required: false },
    Description: { type: [String], required: false },
    secretKey: { type: String, required: false },
    OwnerDetail: {
        Name: { type: String, required: false },
        EmailID: { type: String, required: false },
    },
    HRDetail: {
        Name: { type: String, required: false },
        EmailID: { type: String, required: false },
    }
});


const JobSchema = new mongoose.Schema({
    Title: { type: String, required: false },
    Position: { type: String, required: false },
    JobPostedTime: { type: Date, default: Date.now() },
    Description: {
        type: [String], required: false,
    },
    Experience: { type: [String], required: false },
    JobType: { type: String, enum: ["FullTime", "PartTime", "Remote"] },
    Salary: { type: String, required: false },
    Responsiblities: [String],
    Overview: [String],
    Qualificaion: [String],
    Benifits: [String],
    company: { type: mongoose.Schema.Types.ObjectId, ref: "companies", autopopulate: true }
});

const SavedJobSchema = new mongoose.Schema({
    // User_ID:{ type: String, required:true},
    // Job_ID:{ type: String, required:true},
    Status: { type: String, enum: [true, false], default: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", autopopulate: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", autopopulate: true }
})

const ConnectionSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "companies", autopopulate: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", autopopulate: true },
})

const userFollowSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", autopopulate: false },
    targetId: { type: [mongoose.Schema.Types.ObjectId], ref: "users", autopopulate: true },
})
const CompanyConnectionsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", autopopulate: true },
    targetId: { type: [mongoose.Schema.Types.ObjectId], ref: "companies", autopopulate: true },
})

const JobApplicationsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", autopopulate: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "jobs", autopopulate: true },
    cv: { type: String },
    cId: { type: mongoose.Schema.Types.ObjectId, ref: "companies", autopopulate: true },
    phoneNum: { type: String },
    email: { type: String },
    appliedDate : {
        type: Date,
        default: Date.now,
    }
})

UserSchema.plugin(require("mongoose-autopopulate"))
CompanySchema.plugin(require("mongoose-autopopulate"))
EducationSchema.plugin(require("mongoose-autopopulate"))
WorkExperienceSchema.plugin(require("mongoose-autopopulate"))
JobSchema.plugin(require("mongoose-autopopulate"))
SavedJobSchema.plugin(require("mongoose-autopopulate"))
CompanyConnectionsSchema.plugin(require("mongoose-autopopulate"))
JobApplicationsSchema.plugin(require("mongoose-autopopulate"))
userFollowSchema.plugin(require("mongoose-autopopulate"))

const User = mongoose.model("users", UserSchema);
const Company = mongoose.model("companies", CompanySchema);
const JobPost = mongoose.model("jobs", JobSchema);
const SavedJob = mongoose.model("savedjobs", SavedJobSchema);
const Connection = mongoose.model("connections", ConnectionSchema);
const JobApplications = mongoose.model("jobapplications", JobApplicationsSchema)
const UserFollow = mongoose.model("userFollow", userFollowSchema);
const CompanyConnections = mongoose.model("companyConnections", CompanyConnectionsSchema);


module.exports = { User, Company, JobPost, SavedJob, Connection, JobApplications, UserFollow, CompanyConnections };