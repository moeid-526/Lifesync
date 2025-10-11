import React, { useEffect, useState } from "react";
import "./styles.css";
import { FaRobot, FaLock, FaChartBar, FaDatabase, FaUser, FaLightbulb } from "react-icons/fa";

const Services = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleVisibilityChange = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setIsVisible(true); // Fade in when section is in view
      } else {
        setIsVisible(false); // Fade out when section goes out of view
      }
    });
  };

  useEffect(() => {
    const servicesSection = document.querySelector('.services-section');
    const observer = new IntersectionObserver(handleVisibilityChange, {
      threshold: 0.15 // Trigger when 30% of the section is visible
    });

    if (servicesSection) {
      observer.observe(servicesSection);
    }

    return () => {
      if (servicesSection) {
        observer.unobserve(servicesSection);
      }
    };
  }, []);

  return (
    <section id="services" className={`services-section ${isVisible ? "fade-in" : ""}`}>
      <h2 className="section-title">OUR SERVICES</h2>
      <p className="section-subtitle">
        Explore the cutting-edge services LifeSync offers to enhance your mental well-being and secure your personal growth journey.
      </p>

      <div className="services-container">
        <div className="service-card">
          <div className="service-icon"><FaRobot /></div>
          <div className="service-content">
            <h3>AI-Powered Mental Health Support</h3>
            <p>Engage in sensitive, AI-driven conversations that analyze emotional states and provide personalized coping strategies and advice.</p>
          </div>
        </div>

        <div className="service-card">
          <div className="service-icon"><FaLock /></div>
          <div className="service-content">
            <h3>Blockchain-Based System Logs Storage</h3>
            <p>Securely store system logs using blockchain technology, ensuring data integrity and tamper-proof record keeping.</p>
          </div>
        </div>

        <div className="service-card">
          <div className="service-icon"><FaChartBar /></div>
          <div className="service-content">
            <h3>AI-Powered Report Generation</h3>
            <p>Receive AI-generated weekly reports that analyze emotional trends, reflection consistency, and engagement over time.</p>
          </div>
        </div>

        <div className="service-card">
          <div className="service-icon"><FaDatabase /></div>
          <div className="service-content">
            <h3>AI-Powered Secure Time Capsule</h3>
            <p>Store and protect multimedia content with steganography, ensuring hidden data security and retrieval on a set future date.</p>
          </div>
        </div>

        <div className="service-card">
          <div className="service-icon"><FaUser /></div>
          <div className="service-content">
            <h3>User Registration & Progress Tracking</h3>
            <p>Track personal growth, monitor emotional trends, and gain AI-driven insights for continuous self-improvement.</p>
          </div>
        </div>

        <div className="service-card">
          <div className="service-icon"><FaLightbulb /></div>
          <div className="service-content">
            <h3>Inspirational Reflection Space</h3>
            <p>Receive personalized affirmations and motivational quotes while maintaining a personal journal for self-reflection.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
