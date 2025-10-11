import React, { useEffect, useState } from "react";
import "./styles.css";
import { FaRobot, FaHandHoldingHeart, FaBookOpen, FaLock, FaEnvelope, FaChartLine } from "react-icons/fa";

const WhyChooseLifeSync = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleVisibilityChange = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setIsVisible(true);  // Fade in when section is in view
      } else {
        setIsVisible(false);  // Fade out when section goes out of view
      }
    });
  };

  useEffect(() => {
    const whyChooseSection = document.querySelector('.why-choose-section');
    const observer = new IntersectionObserver(handleVisibilityChange, {
      threshold: 0.3 // Trigger when 30% of the section is visible
    });

    if (whyChooseSection) {
      observer.observe(whyChooseSection);
    }

    return () => {
      if (whyChooseSection) {
        observer.unobserve(whyChooseSection);
      }
    };
  }, []);

  return (
    <div className={`why-choose-section ${isVisible ? "fade-in" : ""}`}>
      <h2 className="section-title">WHY CHOOSE LIFESYNC</h2>
      <p className="section-subtitle">
        Discover how LifeSync can enhance your emotional and mental well-being through AI and secure data storage.
      </p>

      <div className="features-container">
        <div className="feature-card">
          <div className="feature-icon"><FaRobot /></div>
          <div className="feature-content">
            <h3>AI-Support</h3>
            <p>Receive AI-driven mental health support to manage stress, anxiety, and daily challenges with intelligent insights.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaHandHoldingHeart /></div>
          <div className="feature-content">
            <h3>Free of Cost</h3>
            <p>Access LifeSync's features without any charges, ensuring mental wellness support for everyone, anytime.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaBookOpen /></div>
          <div className="feature-content">
            <h3>Journal Keeping</h3>
            <p>Maintain a secure digital journal to record your thoughts, emotions, and progress in a private space.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaLock /></div>
          <div className="feature-content">
            <h3>Memory Preservation</h3>
            <p>Store and revisit cherished memories securely with our time capsule feature integrated with blockchain security.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaEnvelope /></div>
          <div className="feature-content">
            <h3>Email Based Affirmations</h3>
            <p>Receive daily motivational quotes and affirmations directly in your inbox to keep you inspired and uplifted.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaChartLine /></div>
          <div className="feature-content">
            <h3>Weekly Report Generation</h3>
            <p>Track your emotional trends with AI-generated weekly reports, helping you analyze your mental health journey.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseLifeSync;
