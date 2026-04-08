const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const session = require("express-session")
const { body, validationResult } = require("express-validator")
const { MongoClient, ObjectId } = require("mongodb")
const emailService = require("./lib/emailjs-service")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/diu-transport"

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// Simple session store (in-memory for development)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  }),
)

// MongoDB connection with retry logic
let db
const connectWithRetry = async () => {
  try {
  const client = await MongoClient.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
})
    console.log("Connected to MongoDB")
    db = client.db()
  } catch (error) {
    console.error("MongoDB connection failed, retrying in 5 seconds...", error)
    setTimeout(connectWithRetry, 5000)
  }
}
connectWithRetry()

// Middleware for database connection check
const checkDbConnection = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ message: "Database connection unavailable" })
  }
  next()
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" })
  }
  next()
}

// Admin role middleware
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

// Staff role middleware
const requireStaff = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "staff") {
    return res.status(403).json({ message: "Staff access required" })
  }
  next()
}

// Student role middleware
const requireStudent = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.status(403).json({ message: "Student access required" })
  }
  next()
}

// Validation helpers
const validatePassword = (password) => {
  if (password.length < 6) return "Password must be at least 6 characters"
  if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
  if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
  if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
  return null
}

const validateDiuEmail = (email) => {
  if (!email.endsWith("@diu.edu.bd")) {
    return "Email must be a valid DIU email address (@diu.edu.bd)"
  }
  return null
}

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// EmailJS Configuration Test Endpoint
app.get("/api/emailjs/test", async (req, res) => {
  try {
    const testResult = await emailService.testConfiguration()
    res.json({
      message: "EmailJS configuration test",
      ...testResult,
    })
  } catch (error) {
    res.status(500).json({
      message: "EmailJS test failed",
      error: error.message,
    })
  }
})



// Auth Routes
app.post(
  "/api/auth/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["student", "staff"]).withMessage("Invalid role"),
    body("studentId")
      .optional()
      .isLength({ min: 1, max: 16 })
      .isNumeric()
      .withMessage("Student ID must be 1-16 digits only"),
  ],
  checkDbConnection,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, email, password, role, studentId } = req.body

      // Additional email validation
      const emailError = validateDiuEmail(email)
      if (emailError) {
        return res.status(400).json({ message: emailError })
      }

      // Password strength validation
      const passwordError = validatePassword(password)
      if (passwordError) {
        return res.status(400).json({ message: passwordError })
      }

      // Check if user already exists
      const existingUser = await db.collection("users").findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Generate OTP and set expiry (5 minutes)
      const otp = generateOTP()
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user with OTP
      const user = {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        ...(role === "student" && { studentId, balance: 100 }),
        otp,
        otpExpiry,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("users").insertOne(user)

      // Send OTP via EmailJS
      try {
        const emailResult = await emailService.sendOTPEmail(email, name.trim(), otp)

        console.log("Email sent successfully:", emailResult)

        res.status(201).json({
          message: "User created successfully. Please verify with OTP sent to your email.",
          userId: result.insertedId,
          emailSent: true,
          emailService: emailResult.service,
          fallback: emailResult.fallback || false,
          // In development, return OTP for testing
          ...(process.env.NODE_ENV !== "production" && { otp }),
        })
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError)

        // If email fails, still create user but inform about the issue
        res.status(201).json({
          message: "User created but email delivery failed. Please contact support.",
          userId: result.insertedId,
          emailSent: false,
          error: "Email delivery failed",
          // In development, return OTP for testing
          ...(process.env.NODE_ENV !== "production" && { otp }),
        })
      }
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

// Send OTP endpoint (for resending)
app.post(
  "/api/auth/send-otp",
  [body("email").isEmail().withMessage("Invalid email format")],
  checkDbConnection,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email } = req.body

      // Find unverified user
      const user = await db.collection("users").findOne({
        email: email.toLowerCase(),
        verified: false,
      })

      if (!user) {
        return res.status(404).json({
          message: "User not found or already verified",
        })
      }

      // Generate new OTP
      const otp = generateOTP()
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Update user with new OTP
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            otp,
            otpExpiry,
            updatedAt: new Date(),
          },
        },
      )

      // Send OTP via EmailJS
      try {
        const emailResult = await emailService.sendOTPEmail(email, user.name, otp)

        console.log("OTP resent successfully:", emailResult)

        res.json({
          message: "OTP sent successfully to your email.",
          emailSent: true,
          emailService: emailResult.service,
          fallback: emailResult.fallback || false,
          // In development, return OTP for testing
          ...(process.env.NODE_ENV !== "production" && { otp }),
        })
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError)

        res.status(500).json({
          message: "Failed to send OTP email. Please try again.",
          emailSent: false,
          error: "Email delivery failed",
          // In development, return OTP for testing
          ...(process.env.NODE_ENV !== "production" && { otp }),
        })
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

app.post(
  "/api/auth/verify-otp",
  [
    body("userId").isMongoId().withMessage("Invalid user ID"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  ],
  checkDbConnection,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { userId, otp } = req.body

      // Find user and check OTP
      const user = await db.collection("users").findOne({
        _id: new ObjectId(userId),
        otp,
        otpExpiry: { $gt: new Date() },
        verified: false,
      })

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired OTP" })
      }

      // Mark user as verified and clear OTP
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { verified: true, updatedAt: new Date() },
          $unset: { otp: "", otpExpiry: "" },
        },
      )

      res.json({ message: "Account verified successfully" })
    } catch (error) {
      console.error("OTP verification error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

app.post(
  "/api/auth/login",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  checkDbConnection,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user
      const user = await db.collection("users").findOne({
        email: email.toLowerCase(),
        verified: true,
      })

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials or unverified account" })
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" })
      }
      