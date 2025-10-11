import React, { useEffect, useState } from "react";
import "./styles.css";
import aiImage from "../assets/ai.png";
import costImage from "../assets/cost.png";
import journalImage from "../assets/journal.png";
import memoryImage from "../assets/memory.png";
import emailImage from "../assets/email.png";
import reportImage from "../assets/report.png";

const Choose = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleVisibilityChange = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true); // Trigger slide-in when section is in view
      } else {
        setIsVisible(false); // Reset when out of view
      }
    });
  };

  useEffect(() => {
    const chooseSection = document.querySelector(".why-choose-us");
    const observer = new IntersectionObserver(handleVisibilityChange, {
      threshold: 0.1, // Trigger when 30% of the section is visible
    });

    if (chooseSection) {
      observer.observe(chooseSection);
    }

    return () => {
      if (chooseSection) {
        observer.unobserve(chooseSection);
      }
    };
  }, []);

  return (
    <section id="whychoose" className="why-choose-us">
      <h2 className="section-title">WHY CHOOSE US</h2>
      <p className="section-subtitle">
        Discover how we offer innovative solutions that benefit you in every way possible. We combine cutting-edge 
        technology with user-centric design to create a seamless experience that fosters mental well-being and 
        personal growth.
      </p>

      <div className="row">
        {/* AI-Support */}
        <div className={`image-container ${isVisible ? "left-slide" : ""}`}>
          <img src={aiImage} alt="AI Support" />
          <div className="content">
            <h3>AI-Support</h3>
            <p>
              Receive AI-driven mental health support to help manage stress, anxiety, and daily challenges with 
              intelligent insights tailored to your emotional state. Our AI companion adapts to your needs, providing 
              personalized recommendations, calming exercises, and insightful reflections to enhance your mental wellness.
            </p>
          </div>
        </div>

        {/* Free of Cost */}
        <div className={`image-container ${isVisible ? "right-slide" : ""}`}>
          <img src={costImage} alt="Free of Cost" />
          <div className="content">
            <h3>Free of Cost</h3>
            <p>
              Access our platform and all its features without any charges, ensuring that mental wellness support is 
              available to everyone, anytime and anywhere. We believe that mental health care should be a right, not 
              a privilege, and strive to make our services accessible to all users without financial barriers.
            </p>
          </div>
        </div>

        {/* Journal Keeping */}
        <div className={`image-container ${isVisible ? "left-slide" : ""}`}>
          <img src={journalImage} alt="Journal Keeping" />
          <div className="content">
            <h3>Journal Keeping</h3>
            <p>
              Maintain a secure digital journal to record your thoughts, emotions, and progress in a private space 
              that only you can access. Writing down your thoughts can help you process emotions better, track 
              personal growth, and gain valuable insights into your mental health patterns over time.
            </p>
          </div>
        </div>

        {/* Memory Preservation */}
        <div className={`image-container ${isVisible ? "right-slide" : ""}`}>
          <img src={memoryImage} alt="Memory Preservation" />
          <div className="content">
            <h3>Memory Preservation</h3>
            <p>
              Store and revisit cherished memories securely with our time capsule feature, which integrates blockchain 
              technology to ensure privacy and protection. Whether it's heartfelt messages, voice notes, or photos, 
              you can relive special moments and reflect on your journey in a safe and encrypted environment.
            </p>
          </div>
        </div>

        {/* Email Based Affirmations */}
        <div className={`image-container ${isVisible ? "left-slide" : ""}`}>
          <img src={emailImage} alt="Email Based Affirmations" />
          <div className="content">
            <h3>Email Based Affirmations</h3>
            <p>
              Receive daily motivational quotes and affirmations directly in your inbox to stay inspired and uplifted. 
              These handpicked affirmations are designed to encourage positive thinking, boost self-confidence, and 
              remind you of your worth, helping you stay motivated on your journey toward emotional well-being.
            </p>
          </div>
        </div>

        {/* Weekly Report Generation */}
        <div className={`image-container ${isVisible ? "right-slide" : ""}`}>
          <img src={reportImage} alt="Weekly Report Generation" />
          <div className="content">
            <h3>Weekly Report Generation</h3>
            <p>
              Track your emotional trends with AI-generated weekly reports, offering you a comprehensive analysis of 
              your mental health journey. These reports highlight patterns, suggest areas for improvement, and provide 
              actionable insights to help you make informed decisions about your emotional well-being.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Choose;
