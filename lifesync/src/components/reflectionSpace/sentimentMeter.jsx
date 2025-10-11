import React from "react";
import GaugeChart from 'react-gauge-chart';
import "../styles.css"; // Keep your existing styles

const SentimentMeter = ({ sentiment = "neutral" }) => {
  // Convert sentiment to gauge value (0-1)
  const getGaugeValue = () => {
    switch (sentiment) {
      case "positive":
        return 0.90; // Right side (Positive)
      case "negative":
        return 0.10; // Left side (Negative)
      default:
        return 0.5; // Center (Neutral)
    }
  };

  return (
    <div className="meter-wrapper">
      <h4 className="meter-title">🧠 Sentiment Meter</h4>

      <div className="gauge-container">
        <GaugeChart
          id="sentiment-gauge"
          nrOfLevels={3}
          colors={["#FF5F5F", "#FFD700", "#4CAF50"]} // Red, Yellow, Green
          arcWidth={0.3}
          arcPadding={0.02}
          cornerRadius={3}
          percent={getGaugeValue()}
          textColor="#333"
          needleColor="#5A5A5A"
          needleBaseColor="#5A5A5A"
          formatTextValue={() => ""} // Hide default percentage text
        />
        
        <div className="gauge-labels">
          <span className="negative-label">😞 Negative</span>
          <span className="neutral-label">😐 Neutral</span>
          <span className="positive-label">😊 Positive</span>
        </div>
      </div>

      <p className="sentiment-text">
        Current Sentiment: <strong>{sentiment?.toUpperCase() || "NEUTRAL"}</strong>
      </p>
    </div>
  );
};

export default SentimentMeter;