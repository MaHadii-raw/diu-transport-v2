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

      // Create session
      const sessionUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.studentId && { studentId: user.studentId }),
        ...(user.balance !== undefined && { balance: user.balance }),
      }

      req.session.user = sessionUser

      res.json({ message: "Login successful", user: sessionUser })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out" })
    }
    res.json({ message: "Logged out successfully" })
  })
})

app.get("/api/auth/session", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user })
  } else {
    res.status(401).json({ message: "No active session" })
  }
})
// Path Routes
app.get("/api/paths", checkDbConnection, async (req, res) => {
  try {
    const paths = await db.collection("paths").find({ active: true }).toArray()
    res.json({ paths })
  } catch (error) {
    console.error("Error fetching paths:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Ticket Routes with atomic booking
app.post(
  "/api/tickets/book",
  [
    body("userId").isMongoId().withMessage("Invalid user ID"),
    body("pathId").isMongoId().withMessage("Invalid path ID"),
    body("pathName").notEmpty().withMessage("Path name is required"),
    body("pickup").notEmpty().withMessage("Pickup point is required"),
    body("dropoff").notEmpty().withMessage("Dropoff point is required"),
    body("fare").isFloat({ min: 1 }).withMessage("Fare must be a positive number"),
  ],
  requireStudent,
  checkDbConnection,
  async (req, res) => {
    try {
      console.log("Ticket booking request received:", req.body)
      console.log("Session user:", req.session.user)

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array())
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { userId, pathId, pathName, pickup, dropoff, fare } = req.body

      // Verify user matches session
      if (req.session.user._id.toString() !== userId) {
        console.log("User ID mismatch:", req.session.user._id.toString(), "vs", userId)
        return res.status(403).json({ message: "Unauthorized" })
      }

      // Verify path exists and calculate fare server-side
      const path = await db.collection("paths").findOne({
        _id: new ObjectId(pathId),
        active: true,
      })

      if (!path) {
        console.log("Path not found:", pathId)
        return res.status(404).json({ message: "Path not found" })
      }

      console.log("Found path:", path)

      // Server-side fare calculation for security
      const pickupIndex = path.points.findIndex((p) => p.name === pickup)
      const dropoffIndex = path.points.findIndex((p) => p.name === dropoff)

      console.log("Pickup index:", pickupIndex, "Dropoff index:", dropoffIndex)

      if (pickupIndex === -1 || dropoffIndex === -1 || pickupIndex >= dropoffIndex) {
        console.log("Invalid pickup/dropoff points")
        return res.status(400).json({ message: "Invalid pickup/dropoff points" })
      }

      let calculatedFare = 0
      for (let i = pickupIndex; i < dropoffIndex; i++) {
        const segment = path.segments.find((s) => s.from === path.points[i].name && s.to === path.points[i + 1].name)
        if (segment) {
          calculatedFare += segment.fare
        }
      }

      console.log("Calculated fare:", calculatedFare, "Provided fare:", fare)

      if (Math.abs(calculatedFare - fare) > 0.01) {
        return res.status(400).json({ message: "Fare mismatch" })
      }

      // Atomic balance check and deduction
      const userUpdateResult = await db.collection("users").findOneAndUpdate(
        {
          _id: new ObjectId(userId),
          balance: { $gte: fare },
        },
        {
          $inc: { balance: -fare },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" },
      )
      console.log(userUpdateResult)

      // if (!userUpdateResult) {
      //   console.log("Insufficient balance for user:", userId)
      //   return res.status(400).json({ message: "Insufficient balance" })
      // }

      console.log("User balance updated:", userUpdateResult.balance)

      // Create ticket
      const ticket = {
        userId: new ObjectId(userId),
        pathId: new ObjectId(pathId),
        pathName,
        pickup,
        dropoff,
        fare,
        used: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }

      const ticketResult = await db.collection("tickets").insertOne(ticket)
      ticket._id = ticketResult.insertedId

      console.log("Ticket created:", ticket)

      // Update session balance
      req.session.user.balance = userUpdateResult.balance

      res.status(201).json({
        message: "Ticket booked successfully",
        ticket,
        newBalance: userUpdateResult.balance,
      })
    } catch (error) {
      console.error("Error booking ticket:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

app.get("/api/tickets/:id", requireAuth, checkDbConnection, async (req, res) => {
  try {
    const ticketId = req.params.id

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" })
    }

    const ticket = await db.collection("tickets").findOne({
      _id: new ObjectId(ticketId),
    })

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    // Check if user owns this ticket (unless staff/admin)
    if (req.session.user.role === "student" && ticket.userId.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json({ ticket })
  } catch (error) {
    console.error("Error fetching ticket:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.get("/api/tickets/user/:userId", requireAuth, checkDbConnection, async (req, res) => {
  try {
    const userId = req.params.userId

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    // Check if user is accessing their own tickets
    if (req.session.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" })
    }

    const tickets = await db
      .collection("tickets")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()

    res.json({ tickets })
  } catch (error) {
    console.error("Error fetching user tickets:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.post(
  "/api/tickets/:id/verify",
  [body("staffId").isMongoId().withMessage("Invalid staff ID")],
  requireStaff,
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

      const { staffId } = req.body
      const ticketId = req.params.id

      if (!ObjectId.isValid(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" })
      }

      // Verify staff ID matches session
      if (req.session.user._id.toString() !== staffId) {
        return res.status(403).json({ message: "Unauthorized" })
      }

      const ticket = await db.collection("tickets").findOne({
        _id: new ObjectId(ticketId),
      })

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" })
      }

      if (ticket.used) {
        return res.status(400).json({ message: "Ticket already used" })
      }

      if (new Date(ticket.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Ticket expired" })
      }

      // Mark ticket as used
      await db.collection("tickets").updateOne(
        { _id: new ObjectId(ticketId) },
        {
          $set: {
            used: true,
            verifiedBy: new ObjectId(staffId),
            verifiedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      )

      res.json({ message: "Ticket verified successfully" })
    } catch (error) {
      console.error("Error verifying ticket:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)
// Bus Location Routes
app.post(
  "/api/bus/location",
  [
    body("staffId").isMongoId().withMessage("Invalid staff ID"),
    body("location.lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
    body("location.lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  ],
  requireStaff,
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

      const { staffId, location, timestamp } = req.body

      // Verify staff ID matches session
      if (req.session.user._id.toString() !== staffId) {
        return res.status(403).json({ message: "Unauthorized" })
      }

      const locationData = {
        staffId: new ObjectId(staffId),
        location,
        timestamp: new Date(timestamp || Date.now()),
        createdAt: new Date(),
      }

      await db.collection("bus_locations").insertOne(locationData)

      res.json({ message: "Location updated successfully" })
    } catch (error) {
      console.error("Error updating location:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

app.get("/api/bus/location/:pathId", requireAuth, checkDbConnection, async (req, res) => {
  try {
    const pathId = req.params.pathId

    if (!ObjectId.isValid(pathId)) {
      return res.status(400).json({ message: "Invalid path ID" })
    }

    // Get latest locations (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const locations = await db
      .collection("bus_locations")
      .find({ timestamp: { $gte: thirtyMinutesAgo } })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    res.json({ locations })
  } catch (error) {
    console.error("Error fetching bus locations:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})
// User Profile Routes
app.put(
  "/api/users/:id",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("photo").optional().isURL().withMessage("Photo must be a valid URL"),
  ],
  requireAuth,
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

      const { name, photo } = req.body
      const userId = req.params.id

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" })
      }

      // Check if user is updating their own profile
      if (req.session.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" })
      }

      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            name: name.trim(),
            ...(photo && { photo }),
            updatedAt: new Date(),
          },
        },
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" })
      }

      const updatedUser = await db.collection("users").findOne({
        _id: new ObjectId(userId),
      })
      delete updatedUser.password

      // Update session
      req.session.user.name = updatedUser.name
      if (updatedUser.photo) req.session.user.photo = updatedUser.photo

      res.json({ message: "Profile updated successfully", user: updatedUser })
    } catch (error) {
      console.error("Error updating profile:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)

app.post(
  "/api/users/:id/topup",
  [body("amount").isFloat({ min: 1, max: 1000 }).withMessage("Amount must be between 1 and 1000")],
  requireStudent,
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

      const { amount } = req.body
      const userId = req.params.id

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" })
      }

      // Check if user is topping up their own account
      if (req.session.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" })
      }

      const result = await db.collection("users").findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
          $inc: { balance: amount },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" },
      )

      if (!result) {
        return res.status(404).json({ message: "User not found" })
      }

      // Update session balance
      req.session.user.balance = result.balance

      res.json({
        message: "Top-up successful",
        newBalance: result.balance,
      })
    } catch (error) {
      console.error("Error processing top-up:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)
// Schedule Routes
app.get("/api/schedules", checkDbConnection, async (req, res) => {
  try {
    const schedules = await db.collection("schedules").find({ active: true }).toArray()
    res.json({ schedules })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})
// Support Routes
app.post(
  "/api/support/tickets",
  [
    body("subject").trim().isLength({ min: 5 }).withMessage("Subject must be at least 5 characters"),
    body("category").isIn(["booking", "payment", "bus", "app", "account", "other"]).withMessage("Invalid category"),
    body("description").trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
    body("priority").isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
  ],
  requireStudent,
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

      const { subject, category, description, priority } = req.body

      const supportTicket = {
        userId: new ObjectId(req.session.user._id),
        userEmail: req.session.user.email,
        userName: req.session.user.name,
        studentId: req.session.user.studentId,
        subject: subject.trim(),
        category,
        description: description.trim(),
        priority,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("support_tickets").insertOne(supportTicket)
      supportTicket._id = result.insertedId

      res.status(201).json({
        message: "Support ticket created successfully",
        ticket: supportTicket,
      })
    } catch (error) {
      console.error("Error creating support ticket:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  },
)
// Admin Routes (protected)
app.use("/api/admin", requireAdmin)

app.get("/api/admin/stats", checkDbConnection, async (req, res) => {
  try {
    const [totalUsers, totalStaff, totalPaths, totalTickets] = await Promise.all([
      db.collection("users").countDocuments({ role: "student" }),
      db.collection("users").countDocuments({ role: "staff" }),
      db.collection("paths").countDocuments({ active: true }),
      db.collection("tickets").countDocuments(),
    ])

    const stats = {
      totalUsers,
      totalStaff,
      totalPaths,
      totalTickets,
    }

    res.json({ stats })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})
