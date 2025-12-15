const mongoose = require("mongoose");
const { Schema } = mongoose;

// Ensure process.env.URI is available when this file runs, e.g., using a .env file and dotenv
mongoose
  .connect(process.env.URI)
  .then(() => console.log("Connected to MongoDB successfully."))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// --- 1. User Schema (Authentication) ---
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Unique index automatically created
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ["teacher", "student"],
    required: true,
    index: true, // Index for querying by user type
  },
});

// --- 2. Student Schema (Role Profile) ---
const StudentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Enforces 1:1 relationship with User
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  courseYear: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // FIX: Changed 'required: Date.now' to 'default: Date.now'
  },
});

// --- 3. Teacher Schema (Role Profile) ---
const TeacherSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Enforces 1:1 relationship with User
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
    index: true, // Index for querying by department
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- 4. Course Schema ---
const CourseSchema = new Schema({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
    index: true, // Index for querying courses by teacher
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    unique: true, // FIX: Corrected typo from 'unqiue' to 'unique'
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- 5. Enrollment Schema (Many-to-Many link) ---
const EnrollmentSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
});
// Enhancement: Compound unique index to prevent duplicate student-course enrollments
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// --- 6. Assignment Schema ---
const AssignmentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  due_date: {
    type: Date,
    required: true,
    index: true, // Index for sorting/filtering by due date
  },
  teacherId: {
    // Kept for direct teacher lookup
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
    index: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true, // Index for querying assignments by course
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- 7. Submission Schema ---
const SubmissionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true,
  },
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
    index: true, // Index for querying submissions by assignment
  },
  submissionFile: {
    type: String, // Assuming this is a URL or file path
    required: true,
  },
  marks: {
    type: Number,
    min: 0,
    max: 100, // Assuming a 100-point scale; adjust as necessary
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});
// Enhancement: Compound unique index to prevent duplicate submissions by the same student for the same assignment
SubmissionSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

// --- 8. Resource Schema ---
const ResourceSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String, // Assuming this is a URL
    required: true,
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
    index: true,
  },
  courseId: {
    // Added courseId to properly scope the resource
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- 9. Access Schema (Tracking Resource Usage) ---
const AccessSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
    index: true,
  },
  accessedAt: {
    type: Date,
    default: Date.now,
  },
});

// --- 10. Notification Schema ---
const NotificationSchema = new Schema({
  // You can use a combination of fields to target different entities
  // For individual student notifications: use studentId
  // For course-wide notifications: add courseId
  // For notifications from a teacher: use teacherId
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    index: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    index: true, // Index for quickly fetching a student's notifications
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Model Creation ---
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

// --- Export Models ---
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
