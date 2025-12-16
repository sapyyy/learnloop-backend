const express = require("express");
const router = express.Router();

const { Enrollment, Course, Student } = require("../db/mongo");

const auth = require("../middlewares/auth");
const isStudent = require("../middlewares/isStudent");

// enroll into a course
router.post("/courses/:courseId/enroll", auth, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
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
      courseId,
    });

    return res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (error) {
    // Handle duplicate enrollment
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Student already enrolled in this course",
      });
    }

    console.error("Enroll Error:", error);
    return res.status(500).json({
      message: "Failed to enroll in course",
    });
  }
});

module.exports = router;
