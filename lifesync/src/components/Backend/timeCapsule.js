import express from 'express';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const router = express.Router();
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Connect to MongoDB
async function connect() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return client.db('LifesyncDB');
  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
    process.exit(1);
  }
}
const database = await connect();

// Improved steganography processor with cross-platform support
async function processSteganography(inputPath, outputPath, secret, isVideo = false) {
  return new Promise((resolve, reject) => {
    const mode = isVideo ? 'encode-video' : 'encode-image';
    
    // Use 'python' for Windows, 'python3' for other platforms
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log(`Executing: ${pythonCommand} steganography.py ${mode} ${inputPath} ${outputPath} [hidden]`);
    
    const pythonProcess = spawn(pythonCommand, [
      path.join(__dirname, 'steganography.py'),
      mode,
      inputPath,
      outputPath,
      secret
    ]);

    let errorOutput = '';

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = errorOutput || 'Python process failed without error output';
        console.error(`Python process exited with code ${code}: ${errorMsg}`);
        return reject(new Error(`Steganography failed: ${errorMsg}`));
      }
      console.log('Steganography process completed successfully');
      resolve();
    });

    pythonProcess.on('error', (err) => {
      console.error('Python process error:', err);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

// Create Time Capsule with enhanced error handling
router.post('/create-capsule', upload.single('file'), async (req, res) => {
  let fileCleanupRequired = false;
  
  try {
    const { userId, description, unlockDateTime, useSteganography, hiddenMessage } = req.body;
    
    console.log('Received fields:', {
      userId,
      description,
      unlockDateTime,
      useSteganography,
      hiddenMessage: hiddenMessage ? 'exists' : 'missing',
      file: req.file ? 'exists' : 'missing'
    });

    // Basic validation
    if (!userId || !description || !unlockDateTime) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Date validation
    const unlockDate = new Date(unlockDateTime);
    if (isNaN(unlockDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    let finalFilename = req.file.filename;
    fileCleanupRequired = true;

    // Process steganography if enabled
    if (useSteganography === 'true' && hiddenMessage) {
      try {
        const isVideo = req.file.mimetype.startsWith('video/');
        const isImage = req.file.mimetype.startsWith('image/');
        
        if (!isVideo && !isImage) {
          return res.status(400).json({
            success: false,
            message: 'Steganography only supports images and videos'
          });
        }

        const inputPath = path.join(uploadsDir, req.file.filename);
        const outputPath = path.join(uploadsDir, `steg_${req.file.filename}`);
        
        console.log(`Starting steganography process for ${isVideo ? 'video' : 'image'}`);
        await processSteganography(inputPath, outputPath, hiddenMessage, isVideo);
        
        fs.unlinkSync(inputPath);
        finalFilename = `steg_${req.file.filename}`;
      } catch (error) {
        console.error('Steganography processing failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to process steganography',
          error: error.message,
          details: 'Please ensure Python is installed and available in your PATH'
        });
      }
    }

    const collection = database.collection('timeCapsules');
    const newCapsule = {
      userId,
      filename: finalFilename,
      fileType: req.file.mimetype,
      description,
      unlockDate: unlockDate,
      useSteganography: useSteganography === 'true',
      hiddenMessage: useSteganography === 'true' ? hiddenMessage : undefined,
      createdAt: new Date(),
      fileSize: req.file.size
    };

    const result = await collection.insertOne(newCapsule);
    fileCleanupRequired = false;
    
    res.status(201).json({ 
      success: true,
      message: 'Time Capsule created successfully!',
      capsuleId: result.insertedId
    });

  } catch (error) {
    console.error('🚨 Error creating capsule:', error);
    
    if (fileCleanupRequired && req.file) {
      try {
        fs.unlinkSync(path.join(uploadsDir, req.file.filename));
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// Get User's Time Capsules
router.get('/user-capsules', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const collection = database.collection('timeCapsules');
    const capsules = await collection.find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: capsules
    });

  } catch (error) {
    console.error('🚨 Error fetching capsules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get Capsule File
router.get('/capsule-file', async (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.sendFile(filePath);

  } catch (error) {
    console.error('🚨 Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uploadsDir: uploadsDir,
    mongoConnected: !!database
  });
});

// Mount the router
app.use('/api/time-capsule', router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start the server with port conflict handling
const PORT = 5009;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Time Capsule Service running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🗄️ MongoDB database: ${database.databaseName}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying alternative port...`);
    const alternativePort = PORT + 1;
    app.listen(alternativePort, () => {
      console.log(`Server running on alternative port ${alternativePort}`);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

export default app;