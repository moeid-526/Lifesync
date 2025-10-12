// start-backend.js
import { spawn } from "child_process";
import path from "path";

// List all backend files
const files = [
  "server.js",
  "progress.js",
  "main.js",
  "logs.js",
  "journalKeeping.js",
  "timeCaspule.js",
  "report.js",
  "profile.js",
  "verification.js",
  "feedback.js"
];

// Function to start each file in a separate terminal
files.forEach((file) => {
  const filePath = path.resolve(file);
  
  // Windows / VS Code integrated terminal
  const child = spawn("cmd.exe", ["/c", `start cmd /k node "${filePath}"`], {
    cwd: process.cwd(),
    shell: true,
  });

  child.on("error", (err) => {
    console.error(`❌ Failed to start ${file}:`, err);
  });
});
