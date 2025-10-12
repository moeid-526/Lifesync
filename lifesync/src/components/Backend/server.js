import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection URI (ensure MongoDB is running locally or on Atlas)
const mongoURI = "mongodb://127.0.0.1:27017"; // Update this if you're using MongoDB Atlas
const dbName = "LifesyncDB"; // Your database name
const client = new MongoClient(mongoURI);

// Function to connect to the database
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit if connection fails
  }
}
connectDB();

// Access the Quotes collection
const db = client.db(dbName);
const quotesCollection = db.collection("Quotes"); // Your collection name

// Endpoint to get a random quote
app.get("/get-random-quote", async (req, res) => {
  try {
    // Fetch all quotes from the database, excluding the '_id' field
    const allQuotes = await quotesCollection.find({}, { projection: { quote: 1, _id: 0 } }).toArray();
    
    if (allQuotes.length === 0) {
      return res.status(404).json({ message: "No quotes found" });
    }

    // Randomly pick a quote from the list
    const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
    
    console.log(randomQuote); // Log the random quote to verify

    res.json({ quote: randomQuote.quote }); // Send the 'quote' field
  } catch (error) {
    console.error("Error fetching random quote:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server on port 5000
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
