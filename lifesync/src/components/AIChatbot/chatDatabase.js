// Lifesync/lifesync/src/components/AIChatbot/chatDatabase.js

import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb://localhost:27017"; // or your connection string
const client = new MongoClient(uri);
const dbName = "LifesyncDB";
const collectionName = "Chats";

// Save a new chat session (array of user/bot messages)
export async function saveChatSession(email, messages) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const chats = db.collection(collectionName);

    const chatSession = {
      email,
      messages, // array of { sender: "user" | "bot", text: "..." }
      createdAt: new Date(),
    };

    const result = await chats.insertOne(chatSession);
    return result.insertedId;
  } catch (err) {
    console.error("Error saving chat session:", err);
    return null;
  }
}

// Fetch all previous chats for a user
export async function getUserChats(email) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const chats = db.collection(collectionName);

    const sessions = await chats
      .find({ email })
      .sort({ createdAt: -1 })
      .project({ _id: 1, createdAt: 1 }) // only return id and date
      .toArray();

    return sessions;
  } catch (err) {
    console.error("Error fetching chat sessions:", err);
    return [];
  }
}

// Delete a specific chat session by ID
export async function deleteChatSession(chatId) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const chats = db.collection(collectionName);

    const result = await chats.deleteOne({ _id: new ObjectId(chatId) });
    return result; // It returns an object containing the deletedCount field
  } catch (err) {
    console.error("Error deleting chat session:", err);
    return { deletedCount: 0 }; // Return zero if deletion failed
  }
}


// Fetch a specific chat session by ID
export async function getChatById(chatId) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const chats = db.collection(collectionName);

    const session = await chats.findOne({ _id: new ObjectId(chatId) });
    return session?.messages || [];
  } catch (err) {
    console.error("Error fetching chat by ID:", err);
    return [];
  }
}
