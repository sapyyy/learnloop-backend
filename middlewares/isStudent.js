const { z } = require("zod");

/**
 * Zod schema to validate decoded JWT user object
 */
const studentSchema = z.object({
  userId: z.string(),
  userType: z.literal("student"),
});

/**
 * Middleware: Allow only students
 */
const isStudent = (req, res, next) => {
  try {
    // req.user is set by auth middleware
    studentSchema.parse(req.user);
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Access denied. Students only.",
    });
  }
};

module.exports = isStudent;
