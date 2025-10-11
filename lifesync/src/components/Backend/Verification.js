// Verification.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import admin from "firebase-admin";

dotenv.config();

// Firebase Admin Initialization
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Express Setup
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5005;

// Email Transporter using Environment Variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // set in .env
    pass: process.env.EMAIL_PASS,  // app password
  },
});

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to Send Verification Code
app.post("/send-verification-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const code = generateCode();

  const mailOptions = {
    from: `LifeSync <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your LifeSync Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🔒 Verify Your Email</h2>
        <p>Use the code below to verify your email and complete your LifeSync signup.</p>
        <h1 style="color: #4CAF50;">${code}</h1>
        <p>If you didn’t request this, you can safely ignore it.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification code sent to ${email}`);
    res.status(200).json({ code });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({ message: "Failed to send verification code." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Verification server running on http://localhost:${PORT}`);
});
