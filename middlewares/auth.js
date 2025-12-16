const jwt = require("jsonwebtoken");
const { z } = require("zod");

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Zod schema for the decoded JWT payload we expect
 */
const decodedUserSchema = z.object({
  userId: z.string(),
  userType: z.enum(["teacher", "student"]),
});

/**
 * Auth middleware - verifies JWT and attaches req.user
 */
const auth = (req, res, next) => {
  // Basic server config check
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined in env");
    return res
      .status(500)
      .json({ message: "Server configuration error: JWT_SECRET not set" });
  }

  // Accept token as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  // Optional: fallback to query param ?token= or x-access-token header
  const token =
    tokenFromHeader || req.headers["x-access-token"] || req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate payload shape with Zod
    const parsed = decodedUserSchema.parse(decoded);

    // Attach small user object for downstream handlers
    req.user = {
      userId: parsed.userId,
      userType: parsed.userType,
    };

    return next();
  } catch (err) {
    // Token expired
    if (err && err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    // Invalid payload shape (Zod)
    if (err instanceof z.ZodError) {
      return res
        .status(401)
        .json({ message: "Invalid token payload", errors: err.errors });
    }

    // Generic invalid token / verification error
    return res.status(401).json({ message: "Invalid authorization token" });
  }
};

module.exports = auth;
