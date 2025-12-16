const express = require("express");
const router = express.Router();

// Models
const { Resource, Assignment, Course } = require("../db/mongo");

// Middlewares
const auth = require("../middlewares/auth");
const isTeacher = require("../middlewares/isTeacher");

/**
 * Generate a unique course code
 */
const generateCourseCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = "CRS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    exists = await Course.findOne({ code });
  }

  return code;
};

/**
 * POST /teacher/courses
 * Teacher creates a course
 */
router.post("/courses", auth, isTeacher, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Course name is required" });
    }

    // Generate unique course code
    const code = await generateCourseCode();

    const course = await Course.create({
      teacherId: req.user.userId,
      name,
      description,
      code,
    });

    return res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
});

// list down all the courses
router.get("/courses", auth, isTeacher, async (req, res) => {
  try {
    const courses = await Course.find({
      teacherId: req.user.userId,
    }).select("_id name code createdAt");

    return res.status(200).json({
      courses,
    });
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    return res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
});

// teacher creates an assignment
router.post(
  "/courses/:courseId/assignments",
  auth,
  isTeacher,
  async (req, res) => {
    try {
      const { title, description, due_date } = req.body;
      const { courseId } = req.params;

      if (!title || !description || !due_date) {
        return res.status(400).json({
          message: "Title, description and due date are required",
        });
      }

      // Ensure course belongs to this teacher
      const course = await Course.findOne({
        _id: courseId,
        teacherId: req.user.userId,
      });

      if (!course) {
        return res.status(403).json({
          message: "You are not allowed to add assignments to this course",
        });
      }

      const assignment = await Assignment.create({
        title,
        description,
        due_date,
        courseId,
        teacherId: req.user.userId,
      });

      return res.status(201).json({
        message: "Assignment created successfully",
        assignment,
      });
    } catch (error) {
      console.error("Create Assignment Error:", error);
      return res.status(500).json({
        message: "Failed to create assignment",
      });
    }
  }
);

// teacher upload resource under course section
router.post(
  "/courses/:courseId/resources",
  auth,
  isTeacher,
  async (req, res) => {
    try {
      const { title, fileUrl } = req.body;
      const { courseId } = req.params;

      if (!title || !fileUrl) {
        return res.status(400).json({
          message: "Title and fileUrl are required",
        });
      }

      // Ensure course belongs to this teacher
      const course = await Course.findOne({
        _id: courseId,
        teacherId: req.user.userId,
      });

      if (!course) {
        return res.status(403).json({
          message: "You are not allowed to add resources to this course",
        });
      }

      const resource = await Resource.create({
        title,
        fileUrl,
        courseId,
        teacherId: req.user.userId,
      });

      return res.status(201).json({
        message: "Resource uploaded successfully",
        resource,
      });
    } catch (error) {
      console.error("Upload Resource Error:", error);
      return res.status(500).json({
        message: "Failed to upload resource",
      });
    }
  }
);

module.exports = router;
