const mongoose = require("mongoose");
const { Schema } = mongoose;

mongoose.connect(process.env.URI);

// userschema to store the password and email of the users be it teacher or student
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ["teacher", "student"],
    required: true,
  },
});

const StudentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  courseYear: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: Date.now,
  },
});

const TeacherSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  department: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CourseSchema = new Schema({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
  },
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const EnrollmentSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
});

const AssignmentSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  due_date: {
    type: Date,
    required: true,
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SubmissionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  submissionFile: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const ResourceSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AccessSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
  },
  accessedAt: {
    type: Date,
    default: Date.now,
  },
});

const NotificationSchema = new Schema({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
  },
  message: {
    type: String,
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);
const Student = mongoose.model("Student", StudentSchema);
const Teacher = mongoose.model("Teacher", TeacherSchema);
const Course = mongoose.model("Course", CourseSchema);
const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);
const Assignment = mongoose.model("Assignment", AssignmentSchema);
const Submission = mongoose.model("Submission", SubmissionSchema);
const Resource = mongoose.model("Resource", ResourceSchema);
const Access = mongoose.model("Access", AccessSchema);
const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = {
  Student,
  Teacher,
  Course,
  User,
  Enrollment,
  Assignment,
  Submission,
  Resource,
  Access,
  Notification,
};
