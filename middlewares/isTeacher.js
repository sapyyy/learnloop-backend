const { z } = require("zod");

/**
 * Zod schema to validate decoded JWT user object
 */
const teacherSchema = z.object({
  userId: z.string(),
  userType: z.literal("teacher"),
});

/**
 * Middleware: Allow only teachers
 */
const isTeacher = (req, res, next) => {
  try {
    // req.user should be set by auth middleware
    teacherSchema.parse(req.user);
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Access denied. Teachers only.",
    });
  }
};

module.exports = isTeacher;
