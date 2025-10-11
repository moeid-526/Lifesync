import React, { useEffect, useState } from "react";
import "./styles.css";
import logo from "../assets/aboutcon.png";

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleVisibilityChange = (entries) => {
    entries.forEach((entry) => {
      // This triggers when the section comes into view
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Add active class to navbar link when section is in view
        document.querySelector(`#link-about`).classList.add("active");
      } else {
        setIsVisible(false);
        document.querySelector(`#link-about`).classList.remove("active");
      }
    });
  };

  useEffect(() => {
    const aboutSection = document.querySelector(".about-section");
    const observer = new IntersectionObserver(handleVisibilityChange, {
      threshold: 0.5, // Trigger when 50% of the section is visible
    });

    if (aboutSection) {
      observer.observe(aboutSection);
    }

    return () => {
      if (aboutSection) {
        observer.unobserve(aboutSection);
      }
    };
  }, []);

  return (
    <section id="about" >
          <div className={`about-section ${isVisible ? "fade-in" : ""}`}>
      {/* Left Decorative Image */}
      <img src={logo} alt="Decorative Left" className="about-image left" />

      <div className="about-content">
        <h2 className="about-heading">ABOUT LIFESYNC</h2>
        <p className="about-description">
          LifeSync is a platform built to enhance emotional and mental well-being by
          integrating advanced AI technology with secure blockchain systems. Our primary
          goal is to empower individuals to better understand and manage their emotional
          journeys while ensuring their data is fully protected and secure.
        </p>
        <p className="about-description">
          Through our innovative features, we offer AI-driven mental health support, allowing
          users to receive real-time emotional assistance. Our secure data storage solutions
          ensure your memories and personal reflections are stored in an unalterable format.
        </p>
        <p className="about-description">
          Join LifeSync today, where we believe everyone deserves a platform that supports
          personal growth, emotional well-being, and self-discovery. Empower your emotional
          journey and take control of your mental well-being with LifeSync!
        </p>
      </div>

      {/* Right Decorative Image */}
      <img src={logo} alt="Decorative Right" className="about-image right" />
    </div>
    </section>
  );
};

export default About;
