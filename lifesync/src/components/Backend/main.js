// main.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { saveChatSession, getUserChats, getChatById, deleteChatSession } from "../AIChatbot/chatDatabase.js";


const app = express();
const PORT = 5003;

app.use(cors());
app.use(bodyParser.json());

// Route: Save new chat session
app.post("/saveSession", async (req, res) => {
  const { email, messages } = req.body;
  if (!email || !messages) {
    return res.status(400).json({ error: "Missing email or messages" });
  }

  const sessionId = await saveChatSession(email, messages);
  if (sessionId) {
    res.json({ success: true, sessionId });
  } else {
    res.status(500).json({ success: false });
  }
});

// Route: Get all chat sessions for a user
app.get("/getSessions/:email", async (req, res) => {
  const email = req.params.email;
  const sessions = await getUserChats(email);
  res.json(sessions);
});

// Route: Get a specific chat session by ID
app.get("/getSession/:id", async (req, res) => {
  const chatId = req.params.id;
  const messages = await getChatById(chatId);
  res.json(messages);
});

// Route: Delete a specific chat session by ID
app.delete("/deleteSession/:id", async (req, res) => {
    const chatId = req.params.id;
    const result = await deleteChatSession(chatId);
    
    if (result.deletedCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Chat session not found" });
    }
  });
  
// Add this console.log to check if server starts
console.log(`Starting server on http://localhost:${PORT}`);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
