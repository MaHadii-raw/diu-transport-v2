// Test script for EmailJS configuration
const emailService = require("../lib/emailjs-service")
require("dotenv").config()

async function testEmailConfiguration() {
  console.log("🧪 Testing EmailJS Configuration...")
  console.log("=".repeat(50))

  // Test configuration
  const configTest = await emailService.testConfiguration()
  console.log("Configuration Test:", configTest)

  if (!configTest.valid) {
    console.log("❌ Configuration is invalid. Please check your .env file.")
    console.log("Required variables:")
    console.log("- EMAILJS_SERVICE_ID")
    console.log("- EMAILJS_TEMPLATE_ID")
    console.log("- EMAILJS_PUBLIC_KEY")
    console.log("- EMAILJS_PRIVATE_KEY (optional but recommended)")
    return
  }

  console.log("✅ Configuration appears valid!")

  // Ask if user wants to send a real test email
  const readline = require("readline")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question("Do you want to send a real test email? (y/N): ", async (answer) => {
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      rl.question("Enter test email address (default: test@diu.edu.bd): ", async (email) => {
        const testEmail = email.trim() || "test@diu.edu.bd"

        console.log(`\n📧 Sending test email to: ${testEmail}`)

        try {
          const result = await emailService.sendTestEmail(testEmail)

          if (result.success) {
            console.log("✅ Test email sent successfully!")
            console.log("Result:", result.result)
          } else {
            console.log("❌ Test email failed:")
            console.log("Error:", result.error)
          }
        } catch (error) {
          console.log("❌ Test email failed with exception:")
          console.log("Error:", error.message)
        }

        rl.close()
      })
    } else {
      console.log("Test completed without sending real email.")
      rl.close()
    }
  })
}

// Run the test
testEmailConfiguration().catch(console.error)
