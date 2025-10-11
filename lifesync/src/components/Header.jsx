import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "font-awesome/css/font-awesome.min.css";
import "./styles.css";
import logo from "../assets/logoimg.png";

const Header = () => {
  const [activeSection, setActiveSection] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = document.querySelector(".custom-header").offsetHeight;
      window.scrollTo({
        top: element.offsetTop - headerHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (
      location.pathname === "/" ||
      location.pathname === "/login" ||
      location.pathname === "/signup" ||
      location.pathname === "/faqs" ||
      location.pathname.startsWith("/dashboard")
    ) {
      setActiveSection("");
    }

    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => sections.forEach((section) => observer.unobserve(section));
  }, [location]);

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const sectionId = location.hash.substring(1);
      if (sectionId) {
        scrollToSection(sectionId);
      }
    }
  }, [location]);

  const handleNavLinkClick = (e, sectionId) => {
    e.preventDefault();
    if (
      location.pathname === "/signup" ||
      location.pathname === "/login" ||
      location.pathname === "/faqs" ||
      location.pathname.startsWith("/dashboard")
    ) {
      navigate("/");
      window.location.hash = sectionId;
    } else {
      scrollToSection(sectionId);
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        localStorage.removeItem("lastActivity");
        localStorage.removeItem("lastLoginTime");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Logout error:", error);
        toast.error("Failed to logout");
      });
  };

  // ✅ Hide logout icon on Home, Login, and Signup pages
  const showLogoutIcon = !["/", "/login", "/signup"].includes(location.pathname);

  // ✅ Show Back Button only when not on Home page
  const showBackButton = !["/", "/dashboard"].includes(location.pathname);

  return (
    <header className="custom-header">
      <div className="container">
        <input type="checkbox" id="menu-toggle" className="hidden-checkbox" />
        <label htmlFor="menu-toggle" className="menu-toggle"></label>

        {/* ✅ Back Button (hidden on Home page) */}
        {showBackButton && (
          <motion.i
            className="fa fa-arrow-left back-button"
            title="Go Back"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
          ></motion.i>
        )}

        {/* ✅ Centered Logo */}
        <div
          className="logo"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
        >
          <img src={logo} alt="LifeSync Logo" />
          <h1>LifeSync</h1>
        </div>

        {/* ✅ Navbar with FAQ inside */}
        <nav className="navbar">
          <ul className="nav-links">
            <li>
              <Link
                to="#about"
                onClick={(e) => handleNavLinkClick(e, "about")}
                className={`nav-link ${
                  activeSection === "about" ? "active" : ""
                }`}
              >
                <i className="fa fa-info-circle"></i> About
              </Link>
            </li>
            <li>
              <Link
                to="#whychoose"
                onClick={(e) => handleNavLinkClick(e, "whychoose")}
                className={`nav-link ${
                  activeSection === "whychoose" ? "active" : ""
                }`}
              >
                <i className="fa fa-check-circle"></i> Why Choose Us
              </Link>
            </li>
            <li>
              <Link
                to="#services"
                onClick={(e) => handleNavLinkClick(e, "services")}
                className={`nav-link ${
                  activeSection === "services" ? "active" : ""
                }`}
              >
                <i className="fa fa-cogs"></i> Services
              </Link>
            </li>
          </ul>

          {/* ✅ Moved FAQ button inside navbar (so it appears in hamburger) */}
          <button onClick={() => navigate("/faqs")} className="faq-button">
            Go to FAQs
          </button>
        </nav>

        {/* ✅ Right-side: only Logout icon now */}
        <div className="header-right">
          {showLogoutIcon && (
            <motion.i
              className="fa fa-sign-out logout-icon"
              title="Logout"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
            ></motion.i>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
