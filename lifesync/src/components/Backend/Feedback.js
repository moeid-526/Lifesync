import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = 5007;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/LifesyncDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const feedbackSchema = new mongoose.Schema({
  name: String,
  feedback: String,
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

// POST - Add new feedback
app.post("/submit-feedback", async (req, res) => {
  const { name, feedback } = req.body;

  try {
    const newFeedback = new Feedback({ name, feedback });
    await newFeedback.save();
    res.status(201).send("Feedback saved successfully");
  } catch (err) {
    res.status(500).send("Error saving feedback");
  }
});

// GET - Retrieve all feedbacks
app.get("/get-feedbacks", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({});
    res.json(feedbacks);
  } catch (err) {
    res.status(500).send("Error retrieving feedbacks");
  }
});

app.listen(PORT, () => {
  console.log(`Feedback server running on http://localhost:${PORT}`);
});
