const express = require("express");
const router = express.Router();

const { Enrollment, Course, Student } = require("../db/mongo");

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

module.exports = router;
