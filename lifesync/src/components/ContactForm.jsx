import React, { useEffect, useState } from "react";
import "./styles.css";import React, { useState } from "react";
import "../App.css"; // ✅ use same global CSS

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="container" style={{ maxWidth: "600px", margin: "80px auto" }}>
      <h2 className="page-title">Contact Us</h2>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>Name</label>
            <input
              className="input"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              className="input"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message"
              rows="5"
              required
            />
          </div>

          <button type="submit" className="button">
            Send Message
          </button>
        </form>
      ) : (
        <div className="thankyou-box">
          <h3>Thank you for reaching out!</h3>
          <p>We’ll get back to you soon. 💬</p>
        </div>
      )}
    </div>
  );
};

export default ContactForm;
