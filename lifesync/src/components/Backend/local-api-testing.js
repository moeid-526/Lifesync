// Importing Express (ES6 Syntax)
import express from 'express';

// Initialize Express App
const app = express();
const port = 5000;

// Middleware to parse JSON data
app.use(express.json());

// In-memory storage (acting as a temporary database)
let dataStorage = [];

// 1️⃣ POST Request - To Send Data
app.post('/api/data', (req, res) => {
  const newData = req.body;
  newData.id = dataStorage.length + 1; // Auto-increment ID
  dataStorage.push(newData);
  res.status(201).send(newData); // Respond with the newly added data
});

// 2️⃣ GET Request - To Receive Data
app.get('/api/data', (req, res) => {
  res.status(200).send(dataStorage); // Send back the entire data list
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
