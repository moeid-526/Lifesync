import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { spawn } from "child_process";
import bodyParser from "body-parser";
import cors from "cors";
import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5012;

const serviceAccountPath = join(__dirname, "firebase-adminsdk.json");
const serviceAccount = JSON.parse(await readFile(serviceAccountPath));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(bodyParser.json());

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "LifesyncDB";
const client = new MongoClient(MONGO_URI);

// ✅ Connect once at server startup
await client.connect();
console.log("✅ MongoDB connected");

async function verifyToken(idToken) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Firebase auth error:", error);
        return null;
    }
}

async function getUserData(userId) {
    try {
        console.log(`📡 Fetching weekly progress data for userId: ${userId}`);
        const db = client.db(DB_NAME);

        const firestore = admin.firestore();
        const userDoc = await firestore.collection("users").doc(userId).get();

        let displayName = userDoc.exists ? userDoc.data().username : null;
        if (!displayName) {
            const userRecord = await admin.auth().getUser(userId);
            displayName = userRecord.displayName || "User";
        }

        console.log(`👤 Username fetched: ${displayName}`);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyDocs = await db.collection("weeklyprogresses")
            .find({
                userId,
                weekEnd: { $gte: sevenDaysAgo }
            })
            .sort({ weekStart: -1 })
            .limit(2)
            .toArray();

        console.log(`✅ Found ${weeklyDocs.length} weekly progress docs`);

        let mergedProgress = {
            moodData: [],
            activeTimePerDay: [],
            journalEntriesPerDay: [],
            chatbotInteractionsPerDay: [],
            chatPairsPerDay: []
        };

        weeklyDocs.forEach(doc => {
            if (doc.moodData) {
                mergedProgress.moodData.push(
                    ...doc.moodData.filter(entry => new Date(entry.date?.$date || entry.date) >= sevenDaysAgo)
                );
            }
            if (doc.activeTimePerDay) {
                mergedProgress.activeTimePerDay.push(
                    ...doc.activeTimePerDay.filter(entry => entry.date && new Date(entry.date) >= sevenDaysAgo)
                );
            }
            if (doc.journalEntriesPerDay) {
                mergedProgress.journalEntriesPerDay.push(
                    ...doc.journalEntriesPerDay.filter(entry => entry.date && new Date(entry.date) >= sevenDaysAgo)
                );
            }
            if (doc.chatbotInteractionsPerDay) {
                mergedProgress.chatbotInteractionsPerDay.push(
                    ...doc.chatbotInteractionsPerDay.filter(entry => entry.date && new Date(entry.date) >= sevenDaysAgo)
                );
            }
            if (doc.chatPairsPerDay) {
                mergedProgress.chatPairsPerDay.push(
                    ...doc.chatPairsPerDay.filter(entry => entry.date && new Date(entry.date) >= sevenDaysAgo)
                );
            }
        });

        console.log("📊 Merged progress:", {
            moodEntries: mergedProgress.moodData.length,
            activeDays: mergedProgress.activeTimePerDay.length,
            journalEntries: mergedProgress.journalEntriesPerDay.length,
            chatbotInteractions: mergedProgress.chatbotInteractionsPerDay.length,
            chatPairsDays: mergedProgress.chatPairsPerDay.length
        });

        return {
            displayName,
            progresses: mergedProgress,
            metadata: { fetchedAt: new Date().toISOString() }
        };
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}

// -------------------- Endpoints --------------------

app.post("/generate-report", async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(401).json({ error: "Authentication required" });

    try {
        const userId = await verifyToken(idToken);
        if (!userId) return res.status(401).json({ error: "Invalid authentication" });

        const userData = await getUserData(userId);

        const py = spawn("python", ["report.py"]);
        let pdfBuffer = Buffer.alloc(0);
        let errorOutput = "";

        py.stdin.write(JSON.stringify(userData));
        py.stdin.end();

        py.stdout.on("data", (data) => {
            pdfBuffer = Buffer.concat([pdfBuffer, data]);
        });

        py.stderr.on("data", (data) => {
            errorOutput += data.toString();
            console.error("Python stderr:", data.toString());
        });

        py.on("close", async (code) => {
            if (code !== 0) {
                return res.status(500).json({
                    error: "Error generating report",
                    details: errorOutput
                });
            }

            try {
                const db = client.db(DB_NAME);
                const createdAt = new Date();
                const dayOfWeek = createdAt.toLocaleDateString("en-US", { weekday: "long" });

                await db.collection("reports").insertOne({
                    userId,
                    pdf: pdfBuffer,
                    createdAt,
                    day: dayOfWeek
                });

                console.log(`💾 Report saved for user ${userId}`);
            } catch (saveErr) {
                console.error("Error saving report to DB:", saveErr);
            }

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=weekly_report.pdf");
            res.send(pdfBuffer);
        });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

app.get("/past-reports", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Auth required" });
    const idToken = authHeader.split(" ")[1];
    const userId = await verifyToken(idToken);
    if (!userId) return res.status(401).json({ error: "Invalid auth" });

    try {
        const db = client.db(DB_NAME);
        const reports = await db.collection("reports")
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(reports.map(r => ({
            _id: r._id,
            createdAt: r.createdAt,
            day: r.day
        })));
    } catch (err) {
        res.status(500).json({ error: "Error fetching past reports" });
    }
});

app.get("/past-reports/:id", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Auth required" });
    const idToken = authHeader.split(" ")[1];
    const userId = await verifyToken(idToken);
    if (!userId) return res.status(401).json({ error: "Invalid auth" });

    try {
        const db = client.db(DB_NAME);
        const report = await db.collection("reports").findOne({ 
            _id: new ObjectId(req.params.id), 
            userId 
        });
        if (!report) return res.status(404).json({ error: "Report not found" });

        // Ensure binary data is sent correctly
        const pdfBuffer = report.pdf.buffer ? report.pdf.buffer : report.pdf; 

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=report.pdf");
        res.send(pdfBuffer);
    } catch (err) {
        console.error("Error fetching report:", err);
        res.status(500).json({ error: "Error fetching report" });
    }
});

app.delete("/past-reports/:id", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Auth required" });
    const idToken = authHeader.split(" ")[1];
    const userId = await verifyToken(idToken);
    if (!userId) return res.status(401).json({ error: "Invalid auth" });

    try {
        const db = client.db(DB_NAME);
        await db.collection("reports").deleteOne({ _id: new ObjectId(req.params.id), userId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error deleting report" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
