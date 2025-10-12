import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
const dbName = "LifesyncDB";

const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
await connectDB();

const db = client.db(dbName);
const quotesCollection = db.collection("Quotes");

app.get("/get-random-quote", async (req, res) => {
  try {
    const allQuotes = await quotesCollection
      .find({}, { projection: { quote: 1, _id: 0 } })
      .toArray();

    if (allQuotes.length === 0) {
      return res.status(404).json({ message: "No quotes found" });
    }

    const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
    res.json({ quote: randomQuote.quote });
  } catch (error) {
    console.error("⚠️ Error fetching random quote:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
