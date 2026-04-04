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
      useUnifiedTopology: true,
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
