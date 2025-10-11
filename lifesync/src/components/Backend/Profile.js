import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const router = express.Router();
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased payload limit to handle large base64 images

// Connect to MongoDB
async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("MongoDB connection error:", e);
  }
}
connect();

// Get profile picture
router.get('/profile-picture', async (req, res) => {
  try {
    const database = client.db('LifesyncDB');
    const collection = database.collection('profilePictures');

    const result = await collection.findOne({ email: req.query.email });

    if (result) {
      res.status(200).json({ profilePicture: result.profilePicture });
    } else {
      res.status(404).json({ message: 'Profile picture not found' });
    }
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', async (req, res) => {
  try {
    const { email, profilePicture } = req.body;

    if (!email || !profilePicture) {
      return res.status(400).json({ message: 'Email and profile picture are required' });
    }

    const database = client.db('LifesyncDB');
    const collection = database.collection('profilePictures');

    await collection.updateOne(
      { email },
      { $set: { email, profilePicture } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Profile picture updated successfully' });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete profile picture
router.delete('/delete-profile-picture', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const database = client.db('LifesyncDB');
    const collection = database.collection('profilePictures');

    await collection.deleteOne({ email });

    res.status(200).json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mount the router
app.use('/api', router);

// Start the server
const PORT = 5006;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
