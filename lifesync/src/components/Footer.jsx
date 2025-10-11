import React, { useEffect, useState } from "react";
import "font-awesome/css/font-awesome.min.css";
import "./styles.css";
import logo from "../assets/logoimg.png";

const Footer = () => {
  const [activeSection, setActiveSection] = useState("");

  // Function to handle scroll behavior with offset for fixed header
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const footerHeight = document.querySelector('.custom-footer').offsetHeight; // Get footer height
      window.scrollTo({
        top: element.offsetTop - 70, // Adjust for footer height
        behavior: "smooth", // Smooth scroll
      });
    }
  };

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id); // Update active section state
          }
        });
      },
      { threshold: 0.2 } // Trigger when 20% of the section is visible
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <footer className="custom-footer">
      <div className="container">
        <div className="footer-logo">
          <img src={logo} alt="LifeSync Logo" />
          <h1>LifeSync</h1>
        </div>
        <nav className="navbar">
          <ul className="nav-links">
            <li>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default anchor click behavior
                  scrollToSection("about");
                }}
                className={`nav-link ${activeSection === "about" ? "active" : ""}`}
              >
                <i className="fa fa-info-circle"></i> About
              </a>
            </li>
            <li>
              <a
                href="#whychoose"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default anchor click behavior
                  scrollToSection("whychoose");
                }}
                className={`nav-link ${activeSection === "whychoose" ? "active" : ""}`}
              >
                <i className="fa fa-check-circle"></i> Why Choose Us
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default anchor click behavior
                  scrollToSection("services");
                }}
                className={`nav-link ${activeSection === "services" ? "active" : ""}`}
              >
                <i className="fa fa-cogs"></i> Services
              </a>
            </li>
          </ul>
        </nav>
        <div className="footer-social">
          <a href="https://www.facebook.com" className="social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-facebook-f"></i>
          </a>
          <a href="https://www.twitter.com" className="social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-twitter"></i>
          </a>
          <a href="https://www.linkedin.com" className="social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-linkedin"></i>
          </a>
          <a href="https://www.instagram.com/lifesync_03?igsh=MTlkMGh6bnllamw2OA==" className="social-icon" target="_blank" rel="noopener noreferrer">
            <i className="fa fa-instagram"></i>
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 LifeSync. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
