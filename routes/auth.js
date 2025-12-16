const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Teacher, Student } = require("../db/mongo");
const { validateRegistration } = require("../middlewares/validation");

// JWT SECRET
const JWT_SECRET = process.env.JWT_SECRET;

// register
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { email, password, userType, name, courseYear, department } =
      req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the Base User
    const newUser = new User({
      email,
      password: hashedPassword,
      userType,
    });

    const savedUser = await newUser.save();

    // 4. Create the Specific Profile
    // Note: If this fails, the 'User' document will still exist.
    try {
      if (userType === "student") {
        const newStudent = new Student({
          userId: savedUser._id,
          name,
          courseYear,
        });
        await newStudent.save();
      } else if (userType === "teacher") {
        const newTeacher = new Teacher({
          userId: savedUser._id,
          name,
          department,
        });
        await newTeacher.save();
      }
    } catch (profileError) {
      // Optional: Clean up the orphan user if profile creation fails
      await User.findByIdAndDelete(savedUser._id);
      throw profileError; // Re-throw to be caught by the main catch block
    }

    // 5. Generate Token
    const token = jwt.sign(
      { userId: savedUser._id, userType: savedUser.userType },
      JWT_SECRET
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        userType: savedUser.userType,
        name: name,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic input check (you can add Zod later)
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // 2. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Generate token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
