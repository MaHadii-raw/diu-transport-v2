require("dotenv").config();

const emailjs = require("@emailjs/nodejs")

class EmailJSService {
  constructor() {
    this.serviceId = process.env.EMAILJS_SERVICE_ID
    this.templateId = process.env.EMAILJS_TEMPLATE_ID
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY
    this.privateKey = process.env.EMAILJS_PRIVATE_KEY

    // Initialize EmailJS with private key
    if (this.privateKey) {
      //emailjs.init(this.privateKey)

    }
  }

  async testConfiguration() {
    try {
      const isConfigured = !!(this.serviceId && this.templateId && this.publicKey)

      return {
        valid: isConfigured,
        service: this.serviceId || "not-configured",
        template: this.templateId || "not-configured",
        publicKey: this.publicKey ? "configured" : "not-configured",
        privateKey: this.privateKey ? "configured" : "not-configured",
        error: isConfigured ? null : "Missing required configuration",
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      }
    }
  }

  async sendOTPEmail(email, name, otp) {
    try {
      if (!this.serviceId || !this.templateId || !this.privateKey) {
        throw new Error("EmailJS not properly configured")
      }

      const templateParams = {
        email: email,
        passcode: otp,
        time: "5 minutes",
      }

      console.log("Sending OTP email with params:", { email, otp: otp.substring(0, 2) + "****" })

      const result = await emailjs.send(this.serviceId, this.templateId, templateParams, {
        publicKey: this.publicKey,
        privateKey: this.privateKey,
      });

      console.log("EmailJS send result:", result)

      return {
        success: true,
        service: "emailjs",
        messageId: result.text,
        fallback: false,
      }
    } catch (error) {
      console.error("EmailJS send failed:", error)

      // In development, log the OTP to console as fallback
      if (process.env.NODE_ENV === "development") {
        console.log(`📧 DEVELOPMENT MODE - OTP for ${email}: ${otp}`)
        return {
          success: true,
          service: "console-fallback",
          fallback: true,
          error: error.message,
        }
      }

      throw error
    }
  }
}

module.exports = new EmailJSService()
