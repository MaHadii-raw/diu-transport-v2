const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const MONGODB_URI = process.env.MONGODB_URI

async function createAdmin() {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  const hashedPassword = await bcrypt.hash("Admin1234", 10)

  const admin = {
    name: "Admin",
    email: "admin@diu.edu.bd",
    password: hashedPassword,
    role: "admin",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // আগের admin থাকলে delete করো
  await db.collection("users").deleteOne({ email: "admin@diu.edu.bd" })
  
  await db.collection("users").insertOne(admin)
  console.log("Admin created successfully!")
  console.log("Email: admin@diu.edu.bd")
  console.log("Password: Admin1234")

  await client.close()
}

createAdmin()