const express = require("express");
const router = express.Router();

const {
  Assignment,
  Enrollment,
  Course,
  Student,
  Submission,
} = require("../db/mongo");

const auth = require("../middlewares/auth");
const isStudent = require("../middlewares/isStudent");

// join the course based on the code
router.post("/courses/join", auth, isStudent, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Course code is required",
      });
    }

    // Find course by code
    const course = await Course.findOne({
      code: code.toUpperCase(),
    });

    if (!course) {
      return res.status(404).json({
        message: "Invalid course code",
      });
    }

    // Find student profile
    const student = await Student.findOne({
      userId: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Enroll student
    const enrollment = await Enrollment.create({
      studentId: student._id,
      courseId: course._id,
    });

    return res.status(201).json({
      message: "Joined course successfully",
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
      },
    });
  } catch (error) {
    // Handle duplicate enrollment
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already joined this course",
      });
    }

    console.error("Join Course Error:", error);
    return res.status(500).json({
      message: "Failed to join course",
    });
  }
});

// see all joined courses
router.get("/courses", auth, isStudent, async (req, res) => {
  try {
    // Find student profile
    const student = await Student.findOne({
      userId: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Find enrollments
    const enrollments = await Enrollment.find({
      studentId: student._id,
    }).populate({
      path: "courseId",
      select: "_id name code description createdAt",
    });

    // Extract courses
    const courses = enrollments.map((enroll) => enroll.courseId);

    return res.status(200).json({
      courses,
    });
  } catch (error) {
    console.error("Student Courses Error:", error);
    return res.status(500).json({
      message: "Failed to fetch joined courses",
    });
  }
});

// delete course based on id
router.delete("/courses/:courseId/leave", auth, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find student profile
    const student = await Student.findOne({
      userId: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Remove enrollment
    const enrollment = await Enrollment.findOneAndDelete({
      studentId: student._id,
      courseId,
    });

    if (!enrollment) {
      return res.status(400).json({
        message: "You are not enrolled in this course",
      });
    }

    return res.status(200).json({
      message: "Successfully left the course",
      courseId,
    });
  } catch (error) {
    console.error("Leave Course Error:", error);
    return res.status(500).json({
      message: "Failed to leave course",
    });
  }
});

// get particular course's assignment
router.get(
  "/courses/:courseId/assignments",
  auth,
  isStudent,
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Find student profile
      const student = await Student.findOne({
        userId: req.user.userId,
      });

      if (!student) {
        return res.status(404).json({
          message: "Student profile not found",
        });
      }

      // Check enrollment
      const enrollment = await Enrollment.findOne({
        studentId: student._id,
        courseId,
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "You are not enrolled in this course",
        });
      }

      // Fetch assignments
      const assignments = await Assignment.find({ courseId })
        .sort({ due_date: 1 })
        .select("_id title description due_date createdAt");

      return res.status(200).json({
        assignments,
      });
    } catch (error) {
      console.error("Student Course Assignments Error:", error);
      return res.status(500).json({
        message: "Failed to fetch assignments",
      });
    }
  }
);

// upload assignment
router.post(
  "/assignments/:assignmentId/submit",
  auth,
  isStudent,
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { submissionFile } = req.body;

      if (!submissionFile) {
        return res.status(400).json({
          message: "submissionFile is required",
        });
      }

      // Find student profile
      const student = await Student.findOne({
        userId: req.user.userId,
      });

      if (!student) {
        return res.status(404).json({
          message: "Student profile not found",
        });
      }

      // Find assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      // Check enrollment in the course
      const enrolled = await Enrollment.findOne({
        studentId: student._id,
        courseId: assignment.courseId,
      });

      if (!enrolled) {
        return res.status(403).json({
          message: "You are not enrolled in this course",
        });
      }

      // Create submission
      const submission = await Submission.create({
        studentId: student._id,
        assignmentId,
        submissionFile,
      });

      return res.status(201).json({
        message: "Assignment submitted successfully",
        submission,
      });
    } catch (error) {
      // Duplicate submission (unique index)
      if (error.code === 11000) {
        return res.status(400).json({
          message: "You have already submitted this assignment",
        });
      }

      console.error("Submit Assignment Error:", error);
      return res.status(500).json({
        message: "Failed to submit assignment",
      });
    }
  }
);

// pratham's part
// LEARNLOOP-BACKEND/routes/student.js (Add this route)

// --- Utility to get student profile ID ---
// Assuming this helper function is available in student.js
const getStudentProfileId = async (userId) => {
  const studentProfile = await Student.findOne({ userId }).select("_id");
  if (!studentProfile) {
    throw new Error("Student profile not found.");
  }
  return studentProfile._id;
};

// GET /student/courses/:courseId/content
// Get course details, assignments, and resources for an enrolled student.
router.get("/courses/:courseId/content", auth, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = await getStudentProfileId(req.user.userId);

    // 1. SECURITY: Check if student is actually enrolled in this course
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId,
    });

    if (!enrollment) {
      // This error will trigger the 403 redirect to the dashboard on the frontend
      return res.status(403).json({
        message: "Access denied. You are not enrolled in this course.",
      });
    }

    // 2. Fetch Course details
    const course = await Course.findById(courseId).select(
      "name code description"
    );

    // 3. Fetch all Assignments
    const assignments = await Assignment.find({ courseId }).select(
      "title description due_date"
    );

    // 4. Fetch all Resources
    const resources = await Resource.find({ courseId }).select("title fileUrl");

    return res.status(200).json({
      course,
      assignments,
      resources,
    });
  } catch (error) {
    console.error("Fetch Student Course Content Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Course ID format." });
    }
    return res.status(500).json({ message: "Failed to fetch course content." });
  }
});

module.exports = router;
