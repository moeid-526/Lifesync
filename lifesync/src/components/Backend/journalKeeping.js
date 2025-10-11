import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import Sentiment from "sentiment"; // 🟢 Import Sentiment library

const app = express();
app.use(express.json());
app.use(cors());

const mongoURI = "mongodb://localhost:27017";
const client = new MongoClient(mongoURI);
const dbName = "LifesyncDB";
let db;

async function connectDB() {
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB");
}

connectDB();

const sentiment = new Sentiment(); // 🟢 Initialize Sentiment instance

// 🟢 Add a New Journal Entry with Sentiment Analysis
app.post("/add-entry", async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🟢 Perform Sentiment Analysis
    const sentimentResult = sentiment.analyze(content);
    let sentimentLabel = "neutral"; // Default

    if (sentimentResult.score > 0) {
      sentimentLabel = "positive";
    } else if (sentimentResult.score < 0) {
      sentimentLabel = "negative";
    }

    const entry = {
      userId,
      content,
      sentiment: sentimentLabel,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("journalEntries").insertOne(entry);
    
    // ✅ Return _id in response
    res.status(201).json({ 
      message: "Journal entry added successfully", 
      _id: result.insertedId,  // <-- 🔥 Fix here
      sentiment: sentimentLabel 
    });

  } catch (error) {
    console.error("Error adding journal entry:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// 🟢 Get All Journal Entries for a User (Including Sentiment)
app.get("/entries/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const entries = await db.collection("journalEntries").find({ userId }).toArray();
    
    res.json(entries); // 🟢 Sentiment is included in response
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🟢 Update a Journal Entry and Recalculate Sentiment
app.put("/update-entry", async (req, res) => {
  try {
    const { userId, entryId, newContent } = req.body;
    if (!userId || !entryId || !newContent) return res.status(400).json({ error: "Missing required fields" });

    // 🟢 Perform Sentiment Analysis on Updated Content
    const sentimentResult = sentiment.analyze(newContent);
    let sentimentLabel = "neutral";
    if (sentimentResult.score > 0) {
      sentimentLabel = "positive";
    } else if (sentimentResult.score < 0) {
      sentimentLabel = "negative";
    }

    await db.collection("journalEntries").updateOne(
      { _id: new ObjectId(entryId), userId },
      { $set: { content: newContent, sentiment: sentimentLabel } } // 🟢 Update sentiment
    );

    res.json({ message: "Journal entry updated successfully", sentiment: sentimentLabel });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🟢 Delete a Journal Entry
app.delete("/delete-entry", async (req, res) => {
  try {
    const { userId, entryId } = req.body;
    if (!userId || !entryId) return res.status(400).json({ error: "Missing required fields" });

    await db.collection("journalEntries").deleteOne({ _id: new ObjectId(entryId), userId });

    res.json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🟢 Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
