const { z } = require("zod");

const registerSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    userType: z.enum(["student", "teacher"]),
    name: z.string().min(1, { message: "Name is required" }),

    courseYear: z.coerce.number().int().min(1).max(6).optional(),
    department: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.userType === "student" && !data.courseYear) return false;
      if (data.userType === "teacher" && !data.department) return false;
      return true;
    },
    {
      message:
        "Missing required fields for the selected role (courseYear for students, department for teachers)",
      path: ["userType"],
    }
  );

const validateRegistration = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.issues[0].message,
        errors: error.issues,
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { validateRegistration };
