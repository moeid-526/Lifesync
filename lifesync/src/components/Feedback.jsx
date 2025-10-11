import React, { useState } from "react";
import axios from "axios";
import "./styles.css";

const Feedback = () => {
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !feedback) return;

    try {
      await axios.post("http://localhost:5007/submit-feedback", {
        name,
        feedback,
      });
      setSuccessMsg("Thank you for your feedback!");
      setName("");
      setFeedback("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <div className="feedback-page fade-in">
      <h2 className="feedback-title">We’d Love Your Feedback</h2>
      <p className="feedback-subtitle">
        Your thoughts help us grow and improve LifeSync. Please share your honest experience with us — every suggestion matters!
      </p>

      <form className="feedback-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          className="feedback-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Your Feedback"
          className="feedback-textarea"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        ></textarea>
        <button className="feedback-button" type="submit">
          Submit Feedback
        </button>
      </form>

      {successMsg && <p className="feedback-success">{successMsg}</p>}
    </div>
  );
};

export default Feedback;
