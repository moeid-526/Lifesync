import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LifesyncDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// ======================
// Schemas
// ======================
const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // ✅ Always UID, not email
  chatbotInteractions: { type: Number, default: 0 },
  journalEntries: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  chatbotInteractionsPerDay: [{ day: String, count: Number }],
  activeTimePerDay: [{ day: String, minutes: Number }],
  moodData: [{ date: Date, value: Number }]
});

const weeklyProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  chatbotInteractions: { type: Number, default: 0 },
  journalEntries: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  chatbotInteractionsPerDay: [{ day: String, date: String, count: Number }],
  journalEntriesPerDay: [{ day: String, date: String, count: Number }],
  activeTimePerDay: [{ day: String, date: String, minutes: Number }],
  moodData: [{ day: String, date: Date, value: Number }],

  // ✅ New structure for chat pairs
  chatPairsPerDay: [{
    day: String,
    date: String,
    pairs: [
      {
        user: String,
        bot: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  }]
});


const Progress = mongoose.model('Progress', progressSchema);
const WeeklyProgress = mongoose.model('WeeklyProgress', weeklyProgressSchema);

// ======================
// Helpers
// ======================
const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getTodayName = () => {
  const index = (new Date().getDay() + 6) % 7;
  return orderedDays[index];
};

const getCurrentDay = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
};

const getCurrentDateKey = () => new Date().toISOString().split('T')[0];

const getWeekStartEnd = (date = new Date()) => {
  const current = new Date(date);
  const day = current.getDay(); // Sunday = 0
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const weekStart = new Date(current);
  weekStart.setDate(current.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};

// ✅ Force UID-only
function normalizeUserId(userId) {
  if (!userId) throw new Error("❌ Missing userId (UID required)");
  if (userId.includes('@')) {
    throw new Error("❌ Email provided as userId. Please use Firebase UID instead.");
  }
  return userId.trim();
}

// ======================
// Initialize
// ======================
const initializeProgressData = (userId) => {
  return new Progress({
    userId,
    chatbotInteractionsPerDay: orderedDays.map(day => ({ day, count: 0 })),
    journalEntries: 0,
    moodData: [],
    activeTimePerDay: orderedDays.map(day => ({ day, minutes: 0 }))
  });
};

const initializeWeeklyProgressData = (userId, weekStart, weekEnd) => {
  return new WeeklyProgress({
    userId,
    weekStart,
    weekEnd,
    chatbotInteractions: 0,
    journalEntries: 0,
    chatbotInteractionsPerDay: orderedDays.map(day => ({
      day,
      date: null,
      count: 0
    })),
    journalEntriesPerDay: orderedDays.map(day => ({
      day,
      date: null,
      count: 0
    })),
    activeTimePerDay: orderedDays.map(day => ({
      day,
      date: null,
      minutes: 0
    })),
    moodData: [],

    // ✅ Correct field
    chatPairsPerDay: orderedDays.map(day => ({
      day,
      date: null,
      pairs: []
    }))
  });
};


// ======================
// Weekly Progress Updater
// ======================
async function updateWeeklyProgress(userId, updateFn) {
  const { weekStart, weekEnd } = getWeekStartEnd();
  let weeklyDoc = await WeeklyProgress.findOne({ userId, weekStart });

  if (!weeklyDoc) {
    weeklyDoc = await initializeWeeklyProgressData(userId, weekStart, weekEnd).save();
  }

  updateFn(weeklyDoc);

  weeklyDoc.lastActive = new Date();
  await weeklyDoc.save();
}

// ======================
// Routes
// ======================
app.get('/progress/:userId', async (req, res) => {
  try {
    const userId = normalizeUserId(req.params.userId);

    let progress = await Progress.findOne({ userId });
    if (!progress) progress = await initializeProgressData(userId).save();

    res.json({
      chatbotInteractions: progress.chatbotInteractions,
      journalEntries: progress.journalEntries,
      lastActive: formatLastActive(progress.lastActive),
      chatbotInteractionsPerDay: progress.chatbotInteractionsPerDay,
      activeTimePerDay: progress.activeTimePerDay,
      moodData: progress.moodData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mood logging
app.post('/mood', async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    const { mood, date } = req.body;

    let progress = await Progress.findOne({ userId });
    if (!progress) progress = await initializeProgressData(userId);

    const moodEntry = { date: date || new Date(), value: mood };
    progress.moodData.push(moodEntry);
    if (progress.moodData.length > 30) progress.moodData = progress.moodData.slice(-30);
    await progress.save();

    await updateWeeklyProgress(userId, (weeklyDoc) => {
      const today = getTodayName();
      weeklyDoc.moodData.push({
        day: today,
        date: new Date(),
        value: mood
      });
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mood trend
app.get('/mood-trend/:userId', async (req, res) => {
  try {
    const userId = normalizeUserId(req.params.userId);
    const progress = await Progress.findOne({ userId });
    if (!progress) return res.status(404).json({ message: 'User progress not found' });

    const sortedMood = [...progress.moodData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastSeven = sortedMood.slice(-7).map(entry => ({
      date: new Date(entry.date).toISOString().split('T')[0],
      value: entry.value
    }));

    res.json({ moodTrend: lastSeven });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Chatbot interaction
app.post('/chatbot-interaction', async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    const { userMessage, botMessage } = req.body;

    const today = getTodayName();
    const todayDate = getCurrentDateKey();

    let progress = await Progress.findOne({ userId });
    if (!progress) progress = await initializeProgressData(userId);

    // ✅ Update counters
    progress.chatbotInteractions += 1;
    const dayEntry = progress.chatbotInteractionsPerDay.find(e => e.day === today);
    if (dayEntry) dayEntry.count += 1;
    else progress.chatbotInteractionsPerDay.push({ day: today, count: 1 });
    progress.lastActive = new Date();
    await progress.save();

    // ✅ Update WeeklyProgress with pairs
    await updateWeeklyProgress(userId, (weeklyDoc) => {
      weeklyDoc.chatbotInteractions += 1;

      const dayEntry = weeklyDoc.chatbotInteractionsPerDay.find(e => e.day === today);
      if (dayEntry) {
        dayEntry.count += 1;
        dayEntry.date = todayDate;
      }

      let chatDay = weeklyDoc.chatPairsPerDay.find(e => e.day === today);
      if (!chatDay) {
        chatDay = { day: today, date: todayDate, pairs: [] };
        weeklyDoc.chatPairsPerDay.push(chatDay);
      }

      chatDay.date = todayDate;
      chatDay.pairs.push({ user: userMessage, bot: botMessage });
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Active time
app.post('/active-time', async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    const { seconds } = req.body;

    let progress = await Progress.findOne({ userId }) || await initializeProgressData(userId);

    const day = getCurrentDay();
    const dateKey = getCurrentDateKey();
    const minutes = Math.floor(seconds / 60);

    const dayEntry = progress.activeTimePerDay.find(entry => entry.day === day);
    if (dayEntry) dayEntry.minutes += minutes;
    else progress.activeTimePerDay.push({ day, minutes });
    if (!progress.timeLogs) progress.timeLogs = {};
    progress.timeLogs[dateKey] = (progress.timeLogs[dateKey] || 0) + seconds;
    await progress.save();

    await updateWeeklyProgress(userId, (weeklyDoc) => {
      const entry = weeklyDoc.activeTimePerDay.find(e => e.day === day);
      if (entry) {
        entry.minutes += minutes;
        entry.date = dateKey;
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Journal entry
app.post('/journal-entry', async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    let progress = await Progress.findOne({ userId });
    if (!progress) progress = await initializeProgressData(userId);

    progress.journalEntries = Math.min(1000, progress.journalEntries + 1);
    progress.lastActive = new Date();
    await progress.save();

    const today = getTodayName();
    const todayDate = getCurrentDateKey();
    await updateWeeklyProgress(userId, (weeklyDoc) => {
      weeklyDoc.journalEntries += 1;
      const dayEntry = weeklyDoc.journalEntriesPerDay.find(e => e.day === today);
      if (dayEntry) {
        dayEntry.count += 1;
        dayEntry.date = todayDate;
      }
    });

    res.json({ success: true, journalEntries: progress.journalEntries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Journal entry delete
app.post('/journal-entry-delete', async (req, res) => {
  try {
    const userId = normalizeUserId(req.body.userId);
    let progress = await Progress.findOne({ userId });
    if (!progress) return res.status(404).json({ message: 'User progress not found' });

    progress.journalEntries = Math.max(0, progress.journalEntries - 1);
    progress.lastActive = new Date();
    await progress.save();

    const today = getTodayName();
    const todayDate = getCurrentDateKey();
    await updateWeeklyProgress(userId, (weeklyDoc) => {
      weeklyDoc.journalEntries = Math.max(0, weeklyDoc.journalEntries - 1);
      const dayEntry = weeklyDoc.journalEntriesPerDay.find(e => e.day === today);
      if (dayEntry) {
        dayEntry.count = Math.max(0, dayEntry.count - 1);
        dayEntry.date = todayDate;
      }
    });

    res.json({ success: true, journalEntries: progress.journalEntries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ======================
// Helpers
// ======================
function formatLastActive(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

// ======================
app.listen(PORT, () => {
  console.log(`Progress server running on http://localhost:${PORT}`);
});
