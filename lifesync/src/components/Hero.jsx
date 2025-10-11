import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import "./styles.css";
import heroSecImg from "../assets/herosecImg.jpg";
import axios from "axios";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [redirectToDashboard, setRedirectToDashboard] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch feedbacks from backend
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get("http://localhost:5007/get-feedbacks");
        setFeedbacks(response.data);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      }
    };

    fetchFeedbacks();
  }, []);

  useEffect(() => {
    // Rotate testimonials every 5 seconds
    if (feedbacks.length === 0) return;

    const interval = setInterval(() => {
      setFade(false); // Start fade-out
      setTimeout(() => {
        setCurrentFeedbackIndex((prevIndex) => 
          (prevIndex + 1) % feedbacks.length
        );
        setFade(true); // Start fade-in
      }, 300); // Let fade-out finish first
    }, 5000);

    return () => clearInterval(interval);
  }, [feedbacks]);

  useEffect(() => {
    // Fade-in animation when section enters viewport
    const heroSection = document.querySelector('.hero-section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsVisible(entry.isIntersecting);
      });
    }, { threshold: 0.2 });

    if (heroSection) observer.observe(heroSection);
    return () => heroSection && observer.unobserve(heroSection);
  }, []);

  useEffect(() => {
    // Check last login time to redirect directly to dashboard
    const lastLoginTime = localStorage.getItem("lastLoginTime");
    const isLoggedIn = auth.currentUser !== null;

    if (lastLoginTime && isLoggedIn) {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - parseInt(lastLoginTime) < twentyFourHours) {
        setRedirectToDashboard(true);
      }
    }
  }, []);

  const handleLoginClick = () => {
    if (redirectToDashboard) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <section id="hero" className={`hero-section ${isVisible ? "fade-in" : ""}`}>
      <div className="hero-container">
        <div className="hero-image center-image">
          <img src={heroSecImg} alt="LifeSync Wellness" />
        </div>

        <div className="hero-content">
          <h1 className="hero-heading">
            Healing <span className="highlight">from Within</span>
          </h1>
          <p className="hero-subheading">
            LifeSync believes in the power of inner healing. Our holistic approach combines 
            AI technology with psychological insights to create lasting positive change.
          </p>
          <h3 className="fed-head">What <span className="mn-head">People Say!</span></h3>

          {feedbacks.length > 0 ? (
            <div className={`hero-testimonial ${fade ? "fade-in-text" : "fade-out-text"}`}>
              <blockquote>
                "{feedbacks[currentFeedbackIndex].feedback}"
              </blockquote>
              <cite>— {feedbacks[currentFeedbackIndex].name}</cite>
            </div>
          ) : (
            <p className="no-feedback-msg">Be the first to share your feedback with LifeSync!</p>
          )}

          <div className="hero-cta">
            <Link to="/signup">
              <button className="cta-btn">Get Started</button>
            </Link>
            <button className="cta-btn secondary" onClick={handleLoginClick}>
              Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
