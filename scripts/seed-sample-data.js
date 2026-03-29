// Seed sample data for development
const { MongoClient } = require("mongodb")
const bcrypt = require("bcrypt")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/diu-transport"

async function seedSampleData() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB for seeding")

    const db = client.db()

    // Sample students
    const sampleStudents = [
      {
        name: "Ahmed Rahman",
        email: "ahmed.rahman@diu.edu.bd",
        password: await bcrypt.hash("student123", 10),
        role: "student",
        studentId: "221-15-4567",
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Fatima Khan",
        email: "fatima.khan@diu.edu.bd",
        password: await bcrypt.hash("student123", 10),
        role: "student",
        studentId: "221-15-4568",
        balance: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mohammad Ali",
        email: "mohammad.ali@diu.edu.bd",
        password: await bcrypt.hash("student123", 10),
        role: "student",
        studentId: "221-15-4569",
        balance: 750,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Sample staff
    const sampleStaff = [
      {
        name: "Karim Uddin",
        email: "karim.uddin@diu.edu.bd",
        password: await bcrypt.hash("staff123", 10),
        role: "staff",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Rashida Begum",
        email: "rashida.begum@diu.edu.bd",
        password: await bcrypt.hash("staff123", 10),
        role: "staff",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    try {
      await db.collection("users").insertMany([...sampleStudents, ...sampleStaff])
      console.log("Sample users created")
    } catch (error) {
      console.log("Some sample users may already exist")
    }

    // Sample schedules
    const paths = await db.collection("paths").find({}).toArray()

    if (paths.length > 0) {
      const sampleSchedules = paths.map((path) => ({
        pathId: path._id,
        pathName: path.name,
        departureTimes: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
        capacity: 40,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      try {
        await db.collection("schedules").insertMany(sampleSchedules)
        console.log("Sample schedules created")
      } catch (error) {
        console.log("Sample schedules may already exist")
      }
    }

    console.log("Sample data seeding completed!")
  } catch (error) {
    console.error("Sample data seeding failed:", error)
  } finally {
    await client.close()
  }
}

seedSampleData()
