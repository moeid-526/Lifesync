import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { getAuth } from "firebase/auth";
import SentimentMeter from "./sentimentMeter";
import "../styles.css";

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [updatedContent, setUpdatedContent] = useState("");
  const [sentiment, setSentiment] = useState("neutral");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const entriesListRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { // Only add entry if Enter is pressed without Shift (to prevent new line)
      e.preventDefault(); // Prevents the default behavior (creating a new line)
      handleAddEntry();
    }
  };

  // Initialize Firebase auth
  const auth = getAuth();

  // Scroll entries list to the latest entry
  const scrollToLatestEntry = () => {
    setTimeout(() => {
      if (entriesListRef.current) {
        entriesListRef.current.scrollTop = entriesListRef.current.scrollHeight;
      }
    }, 100);
  };

  // Set user ID and email when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
      } else {
        setUserId("");
        setUserEmail("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch entries when userId changes
  useEffect(() => {
    if (!userId) return;

    const fetchEntries = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/entries/${userId}`);
        // Format the entries with proper _id as string
        const formattedEntries = response.data.map(entry => ({
          ...entry,
          _id: entry._id.toString() // Convert ObjectId to string
        }));
        setEntries(formattedEntries);
        
        if (formattedEntries.length > 0) {
          setSentiment(formattedEntries[formattedEntries.length - 1].sentiment);
        }
        scrollToLatestEntry();
      } catch (err) {
        console.error("Error fetching entries:", err);
      }
    };

    fetchEntries();
  }, [userId]);

  // Log journal entry to progress service
  const logJournalEntry = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await axios.post('http://localhost:5004/journal-entry', { 
        userId: user.uid,
        email: user.email
      });
    } catch (err) {
      console.error('Failed to log journal entry:', err);
    }
  };

  // Handle adding a new journal entry
  const handleAddEntry = async () => {
    if (!newEntry.trim() || !userId) return;

    try {
      const entryData = { userId, content: newEntry };
      const response = await axios.post("http://localhost:5001/add-entry", entryData);
      
      const { _id, sentiment } = response.data;
      setEntries(prevEntries => [
        ...prevEntries,
        { 
          ...entryData, 
          _id, 
          sentiment, 
          createdAt: new Date().toISOString() 
        },
      ]);
      setSentiment(sentiment);
      setNewEntry("");
      scrollToLatestEntry();
      await logJournalEntry();
    } catch (err) {
      console.error("Error adding entry:", err);
    }
  };

  const handleEditClick = (entry) => {
    setEditingId(entry._id);
    setUpdatedContent(entry.content);
  };

  const handleUpdateSubmit = async (entryId) => {
    if (!userId || !updatedContent.trim()) return;

    try {
      const response = await axios.put("http://localhost:5001/update-entry", {
        userId,
        entryId,
        newContent: updatedContent,
      });

      setEntries(entries.map(entry =>
        entry._id === entryId
          ? { 
              ...entry, 
              content: updatedContent, 
              sentiment: response.data.sentiment 
            }
          : entry
      ));
      setEditingId(null);
      scrollToLatestEntry();
    } catch (err) {
      console.error("Error updating entry:", err);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!userId) return;
  
    try {
      await axios.delete("http://localhost:5001/delete-entry", {
        data: { userId, entryId },
      });
      
      // First update the local state
      setEntries(entries.filter(entry => entry._id !== entryId));
      
      // Then decrement the count in the progress service
      try {
        const user = auth.currentUser;
        if (user) {
          await axios.post('http://localhost:5004/journal-entry-delete', { 
            userId: user.uid
          });
        }
      } catch (err) {
        console.error('Failed to update journal entry count:', err);
      }
      
      scrollToLatestEntry();
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const handleDownloadPDF = () => {
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Journal Entries", pdf.internal.pageSize.width / 2, 15, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);

    entries.forEach((entry, index) => {
      const date = new Date(entry.createdAt);
      const formattedDate = `${date.toLocaleDateString()} (${date.toLocaleString(
        "en-US",
        { weekday: "long" }
      )})`;

      const yPosition = 30 + index * 20;
      pdf.text(`${index + 1}. ${formattedDate}`, 10, yPosition);
      pdf.text(entry.content, 10, yPosition + 10, { maxWidth: 180 });
    });

    pdf.save("Journal_Entries.pdf");
  };

  return (
    <div>
      <div className="journal-header">
        <h3 className="mn-head">
          Your <span className="mn-high">Mind's</span> Canvas
        </h3>
        <p className="mn-sub">
          A reflection space to express your thoughts and emotions.
        </p>

        <div className="instructions-list">
          <p>✏️ Write your thoughts and emotions freely.</p>
          <p>📝 Update your journal whenever you want.</p>
          <p>❌ Delete unwanted journal entries.</p>
          <p>🧠 View sentiment analysis to track emotions.</p>
          <p>📜 Download your journal as a PDF.</p>
        </div>
      </div>

      <div className="journal-container">
        <div className="writing-section">
          <div className="journal-entry-header">
            <h3 className="mn-head">
              Write <span className="mn-high">Your</span> Thoughts
            </h3>
          </div>
          <SentimentMeter sentiment={sentiment} />

          <textarea
            className="journal-textarea"
            placeholder="Write your thoughts here..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="journal-button" onClick={handleAddEntry}>
            ✨ Save Entry
          </button>
        </div>

        <div className="entries-container">
          <div className="entries-header">
            <h3 className="mn-head">Your <span className="mn-high">Journal</span> Entries</h3>
          </div>

          <div className="entries-list" ref={entriesListRef}>
            {entries.map((entry) => {
              const date = new Date(entry.createdAt);
              const formattedDate = `${date.toLocaleDateString()} (${date.toLocaleString(
                "en-US",
                { weekday: "long" }
              )}) - ${date.toLocaleTimeString()}`;

              return (
                <div key={entry._id} className="entry-card">
                  <div className="entry-header">
                    <span className="entry-date">{formattedDate}</span>
                    <div className="entry-actions">
                      <button onClick={() => handleEditClick(entry)}>✏️</button>
                      <button onClick={() => handleDeleteEntry(entry._id)}>🗑️</button>
                    </div>
                  </div>

                  {editingId === entry._id ? (
                    <>
                      <textarea
                        className="edit-textarea"
                        value={updatedContent}
                        onChange={(e) => setUpdatedContent(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="save-button"
                        onClick={() => handleUpdateSubmit(entry._id)}
                      >
                        ✔️ Save
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="entry-content">🗒️ {entry.content}</p>
                      <p className="entry-sentiment">
                        🧠 Sentiment: <strong>{entry.sentiment}</strong>
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <button className="download-button" onClick={handleDownloadPDF}>
            📜 Download Journal as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Journal;