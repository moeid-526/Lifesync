import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use environment variable (from Vercel dashboard)
const mongoURI = process.env.MONGO_URI;
const dbName = "LifesyncDB";

// ✅ Create MongoDB client
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ✅ Connect to MongoDB once (when function is first invoked)
let db, quotesCollection;

async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db(dbName);
      quotesCollection = db.collection("Quotes");
      console.log("✅ Connected to MongoDB Atlas successfully");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}
await connectDB();

// ✅ Define API endpoint
app.get("/api/get-random-quote", async (req, res) => {
  try {
    await connectDB(); // ensure DB is connected
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

// ✅ Export the app (DO NOT use app.listen)
export default app;
