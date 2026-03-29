const { MongoClient } = require("mongodb")
const bcrypt = require("bcrypt")
require("dotenv").config()

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/diu-transport"

async function setupDatabase() {
  let client

  try {
    console.log("🔄 Connecting to MongoDB...")
    client = await MongoClient.connect(MONGODB_URI, {
      useUnifiedTopology: true,
    })

    const db = client.db()
    console.log("✅ Connected to MongoDB")

    // Create collections with indexes
    console.log("🔄 Setting up collections and indexes...")

    // Users collection
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ studentId: 1 }, { sparse: true })
    await db.collection("users").createIndex({ role: 1 })

    // Paths collection
    await db.collection("paths").createIndex({ name: 1 }, { unique: true })
    await db.collection("paths").createIndex({ active: 1 })

    // Tickets collection
    await db.collection("tickets").createIndex({ userId: 1 })
    await db.collection("tickets").createIndex({ pathId: 1 })
    await db.collection("tickets").createIndex({ createdAt: -1 })

    // Schedules collection
    await db.collection("schedules").createIndex({ pathId: 1 })
    await db.collection("schedules").createIndex({ active: 1 })

    // Support tickets collection
    await db.collection("support_tickets").createIndex({ userId: 1 })
    await db.collection("support_tickets").createIndex({ status: 1 })
    await db.collection("support_tickets").createIndex({ createdAt: -1 })

    // Bus locations collection
    await db.collection("bus_locations").createIndex({ staffId: 1 })
    await db.collection("bus_locations").createIndex({ timestamp: -1 })

    console.log("✅ Collections and indexes created successfully")

    // Create default admin user
    console.log("🔄 Creating default admin user...")

    const adminEmail = "admin@diu.edu.bd"
    const adminPassword = "Admin123!"

    const existingAdmin = await db.collection("users").findOne({ email: adminEmail })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)

      await db.collection("users").insertOne({
        name: "System Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      console.log("✅ Default admin user created")
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
    } else {
      console.log("ℹ️ Admin user already exists")
    }

    // Create sample paths
    console.log("🔄 Creating sample paths...")

    const samplePaths = [
      {
        name: "Dhanmondi to DIU",
        points: [
          { name: "Dhanmondi 27", order: 1 },
          { name: "Science Lab", order: 2 },
          { name: "Shahbagh", order: 3 },
          { name: "Press Club", order: 4 },
          { name: "DIU Main Campus", order: 5 },
        ],
        segments: [
          { from: "Dhanmondi 27", to: "Science Lab", fare: 15 },
          { from: "Science Lab", to: "Shahbagh", fare: 10 },
          { from: "Shahbagh", to: "Press Club", fare: 10 },
          { from: "Press Club", to: "DIU Main Campus", fare: 15 },
        ],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Uttara to DIU",
        points: [
          { name: "Uttara Sector 10", order: 1 },
          { name: "Airport Road", order: 2 },
          { name: "Banani", order: 3 },
          { name: "Gulshan 2", order: 4 },
          { name: "DIU Main Campus", order: 5 },
        ],
        segments: [
          { from: "Uttara Sector 10", to: "Airport Road", fare: 20 },
          { from: "Airport Road", to: "Banani", fare: 15 },
          { from: "Banani", to: "Gulshan 2", fare: 10 },
          { from: "Gulshan 2", to: "DIU Main Campus", fare: 20 },
        ],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    for (const path of samplePaths) {
      const existingPath = await db.collection("paths").findOne({ name: path.name })
      if (!existingPath) {
        await db.collection("paths").insertOne(path)
        console.log(`✅ Created path: ${path.name}`)
      } else {
        console.log(`ℹ️ Path already exists: ${path.name}`)
      }
    }

    // Create sample schedules
    console.log("🔄 Creating sample schedules...")

    const paths = await db.collection("paths").find({}).toArray()

    for (const path of paths) {
      const existingSchedule = await db.collection("schedules").findOne({ pathId: path._id })
      if (!existingSchedule) {
        await db.collection("schedules").insertOne({
          pathId: path._id,
          pathName: path.name,
          departureTimes: ["07:00", "08:00", "09:00", "16:00", "17:00", "18:00"],
          capacity: 40,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log(`✅ Created schedule for: ${path.name}`)
      } else {
        console.log(`ℹ️ Schedule already exists for: ${path.name}`)
      }
    }

    console.log("🎉 Database setup completed successfully!")
    console.log("\n📋 Summary:")
    console.log("- Collections and indexes created")
    console.log("- Default admin user created")
    console.log("- Sample paths and schedules created")
    console.log("\n🚀 You can now start the server with: npm run server:dev")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Database connection closed")
    }
  }
}

// Run the setup
setupDatabase()
