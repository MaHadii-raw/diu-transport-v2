# DIU Smart Transport System

A comprehensive smart transportation system for Daffodil International University with digital ticketing, real-time tracking, and administrative management.

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas) - [Download here](https://www.mongodb.com/try/download/community)
- **EmailJS Account** (for OTP delivery) - [Sign up here](https://www.emailjs.com/)
- **Git** - [Download here](https://git-scm.com/)

### 1. Download the Project

\`\`\`bash
# Clone or download the project
git clone <repository-url>
cd diu-transport-system

# OR if you have a ZIP file, extract it and navigate to the folder
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install all dependencies (includes @emailjs/nodejs)
npm install
\`\`\`

### 3. Environment Setup

\`\`\`bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
\`\`\`

**Required Environment Variables:**

\`\`\`env
# Database - Use one of these options:

# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/diu-transport

# Option 2: MongoDB Atlas (recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/diu-transport

# Session Secret (change this!)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# EmailJS Configuration (for OTP delivery)
EMAILJS_SERVICE_ID=service_c708i7y
EMAILJS_TEMPLATE_ID=template_ten167b
EMAILJS_PUBLIC_KEY=your_public_key_here
\`\`\`

### 4. EmailJS Setup

**Step 1: Get your EmailJS Public Key**
- Go to your EmailJS dashboard
- Navigate to Account > API Keys
- Copy your Public Key and add it to your .env file

**Step 2: EmailJS Template Variables**
Your EmailJS template should include these variables:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name
- `{{otp_code}}` - 6-digit OTP code
- `{{university_name}}` - University name (DIU)
- `{{system_name}}` - System name
- `{{expiry_minutes}}` - OTP expiry time
- `{{support_email}}` - Support contact email

**Example EmailJS Template:**
\`\`\`
Subject: DIU Transport - Email Verification

Dear {{to_name}},

Your verification code for {{system_name}} is: {{otp_code}}

This code will expire in {{expiry_minutes}} minutes.

If you didn't request this code, please ignore this email.

Best regards,
{{university_name}} Transport Team
Support: {{support_email}}
\`\`\`

### 5. Database Setup

\`\`\`bash
# Set up database collections and indexes
npm run setup-db

# Seed with sample data (optional)
npm run seed-data
\`\`\`

### 6. Start the Application

**Option A: Start Both Frontend and Backend Together**
\`\`\`bash
# Start both in development mode
npm run dev
\`\`\`

**Option B: Start Separately**

Terminal 1 (Backend):
\`\`\`bash
npm run server:dev
\`\`\`

Terminal 2 (Frontend):
\
