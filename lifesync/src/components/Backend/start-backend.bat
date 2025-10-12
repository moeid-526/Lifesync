@echo off
title LifeSync Backend Launcher

REM Start server.js
start "Server" cmd /k "node server.js"

REM Start progress.js
start "Progress" cmd /k "node progress.js"

REM Start main.js
start "Main" cmd /k "node main.js"

REM Start logs.js
start "Logs" cmd /k "node logs.js"

REM Start journalKeeping.js
start "Journal" cmd /k "node journalKeeping.js"

REM Start timeCaspule.js
start "Time Capsule" cmd /k "node timeCaspule.js"

REM Start report.js
start "Report" cmd /k "node report.js"

REM Start profile.js
start "Profile" cmd /k "node profile.js"

REM Start verification.js
start "Verification" cmd /k "node verification.js"

REM Start feedback.js
start "Feedback" cmd /k "node feedback.js"

echo ✅ All backend files started.
pause
