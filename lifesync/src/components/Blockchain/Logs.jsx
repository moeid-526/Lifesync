// Logs.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../firebaseConfig.js';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const auth = getAuth(firebaseApp);

  useEffect(() => {
    fetchLogs();
  }, []);

  const convertMessageToReadable = (rawMessage) => {
    const routeMap = {
      "/dashboard/systemlogs": "You visited *System Logs* page from *Dashboard*",
      "/dashboard/profile": "You visited *Profile* page from *Dashboard*",
      "/dashboard/timecapsule": "You visited *Time Capsule* page from *Dashboard*",
      "/dashboard/journal": "You visited *Journal* page from *Dashboard*",
      "/dashboard/chatbot": "You visited *Chatbot* page from *Dashboard*",
      "/dashboard/wellness": "You visited *Wellness Hub* page on *Dashboard*",
      "/dashboard": "You visited *Progress Tracking* page on *Dashboard*",
      "/faqs": "You visited the *FAQs* page",
      "/login": "You visited the *FAQs* page",
      "/signup": "You visited the *FAQs* page",
      // ➕ Add more mappings as needed
    };

    // Custom messages
    if (rawMessage === "User Logged In") {
      return "You Logged In To *Lifesync*";
    }

    if (rawMessage === "User Logged Out") {
      return "You Logged Out From *Lifesync*";
    }

    // Page visit fallback
    const match = rawMessage.match(/Visited (\/[a-zA-Z0-9/_-]+)/);
    if (match && match[1] && routeMap[match[1]]) {
      return routeMap[match[1]];
    }

    return rawMessage;
  };

  const fetchLogs = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please log in to view logs');
        return;
      }

      const token = await user.getIdToken();
      const response = await axios.get('http://localhost:5011/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid logs data received");
      }

      const formattedLogs = response.data.map(log => ({
        ...log,
        formattedDate: new Date(log.timestamp * 1000).toLocaleString(),
        readableMessage: convertMessageToReadable(log.message)
      }));

      setLogs(formattedLogs);
      setError('');
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch logs. Please try again.');
    }
  };

  return (
    <div className="log-container">
      <div className="log-header">
        <h3 className="mn-head">
          Blockchain <span className="mn-high">System </span>Logs
        </h3>
      </div>

      <div className="log-instructions">
        <p>
          These are your tamper-proof logs stored on the blockchain.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="logs-list-container">
        {logs.length === 0 ? (
          <p className="no-logs-text">No logs found.</p>
        ) : (
          <div className="logs-list">
            {logs.map((log, index) => (
              <div className="log-entry" key={index}>
                <div className="log-summary">
                  <p
                    className="log-message"
                    dangerouslySetInnerHTML={{
                      __html: `<strong>Action:</strong> ${log.readableMessage.replace(
                        /\*(.*?)\*/g,
                        '<span class="highlight">$1</span>'
                      )}`
                    }}
                  />

                  <p className="log-timestamp">
                    <strong>Time:</strong> {log.formattedDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
