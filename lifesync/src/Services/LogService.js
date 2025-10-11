// src/Services/LogService.js
import axios from 'axios';

const API_URL = "http://localhost:5011/api/log";

const LogService = {
  sendLog: async (message, idToken) => {
    try {
      await axios.post(
        API_URL,
        { message },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
    } catch (err) {
      console.error("Log sending failed:", err.message);
    }
  },

  sendNavigationLog: async (path, idToken) => {
    const message = `Visited ${path}`;
    await LogService.sendLog(message, idToken);
  }
};

export default LogService;
