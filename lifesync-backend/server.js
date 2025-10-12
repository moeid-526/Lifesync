import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

// Directly use working MongoDB URI
const mongoURI =
  "mongodb+srv://lifesync_user:-Lonewolf7861-@fyp.g3girma.mongodb.net/?retryWrites=true&w=majority&appName=fyp";
const dbName = "LifesyncDB";

let client, db, quotesCollection;

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(mongoURI, {
        serverApi: { version: '1' },
        tls: true,
      });
      await client.connect();
      console.log("✅ MongoDB connected successfully");
    }

    if (!db) db = client.db(dbName);
    if (!quotesCollection) quotesCollection = db.collection("Quotes");

    return { db, quotesCollection };
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}


app.get("/api/get-random-quote", async (req, res) => {
  try {
    const { quotesCollection } = await connectDB();
    const allQuotes = await quotesCollection
      .find({}, { projection: { quote: 1, _id: 0 } })
      .toArray();

    if (!allQuotes || allQuotes.length === 0) {
      return res.status(404).json({ message: "No quotes found" });
    }

    const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
    res.json({ quote: randomQuote.quote });
  } catch (error) {
    console.error("⚠️ Error fetching random quote:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default app;
