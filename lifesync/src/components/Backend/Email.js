// === EmailBackendServer.js (or index.js or server.js depending on your project structure) ===
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import fs from "fs";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import admin from "firebase-admin";
import cron from "node-cron";

dotenv.config();
const app = express();
const PORT = 5008;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Firebase Admin Init
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/LifesyncDB")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  emailNotificationsEnabled: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

const Affirmation = mongoose.model("Affirmations", new mongoose.Schema({
  text: String,
  category: String,
}));

// Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// === Routes ===
// Update email preference
app.post("/email-preference", async (req, res) => {
  const { userId, email, emailNotificationsEnabled } = req.body;
  if (!userId || !email) return res.status(400).json({ error: "Missing userId or email" });

  try {
    const updatedUser = await User.findOneAndUpdate(
      { uid: userId },
      {
        email,
        emailNotificationsEnabled,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Updated email preference for ${email} to ${emailNotificationsEnabled}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error updating email preference:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get email preference
app.get("/email-preference/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    const user = await User.findOne({ uid });
    const preference = user?.emailNotificationsEnabled || false;
    res.status(200).json({ emailNotificationsEnabled: preference });
  } catch (err) {
    console.error("❌ Error getting email preference:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// === Email Scheduler ===
const getUsersWithEmailEnabled = async () => {
  try {
    return await User.find({ emailNotificationsEnabled: true });
  } catch (error) {
    console.error("❌ Error fetching users with email enabled:", error);
    return [];
  }
};

const sendEmails = async () => {
  try {
    console.log("⏳ Fetching users with email notifications enabled...");
    const users = await getUsersWithEmailEnabled();

    if (users.length === 0) {
      console.log("ℹ️ No users have enabled email notifications.");
      return;
    }

    for (const user of users) {
      if (!user.email) continue;
      const affirmation = await Affirmation.aggregate([{ $sample: { size: 1 } }]);

      if (affirmation.length > 0) {
        const { text, category } = affirmation[0];

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Weekly Affirmation on ${category}`,
          text: text,
          html: `<p>${text}</p><p><small>You're receiving this email because you enabled notifications. <a href="${process.env.APP_URL}/preferences">Update preferences</a></small></p>`
        });

        console.log(`📧 Email sent to ${user.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Error in sendEmails:", error);
  }
};

// Schedule (every 2 min for testing)
cron.schedule("*/2 * * * *", sendEmails);

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
