import React, { useState } from "react";
import "../styles.css";

const dummyDoctors = {
  Lahore: [
    "Dr. Sarah Williams (Child Psychologist)",
    "Dr. Ali Raza (Clinical Psychologist)",
  ],
  Islamabad: [
    "Dr. John Peterson (Clinical Psychologist)",
    "Dr. Sana Malik (Behavioral Therapist)",
  ],
  Karachi: [
    "Dr. Ayesha Khan (Behavioral Therapist)",
    "Dr. Omar Siddiqui (Clinical Psychologist)",
  ],
};

const Consult = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    city: "",
    description: "",
  });

  const [availableDoctors, setAvailableDoctors] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (formData.city) {
      setAvailableDoctors(dummyDoctors[formData.city] || []);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Your consultation request has been submitted (dummy).");

    // Reset fields
    setFormData({
      fullName: "",
      email: "",
      city: "",
      description: "",
    });
    setAvailableDoctors([]);
  };

  return (
    <div className="consult-container">
      <div className="consult-card">
        <h2 className="mn-head">
            Book <span className="mn-high">Your</span> Consulatation
          </h2>
          <p className="mn-sub">Use this portal to book a session with a psychologist in your city.</p>

        <form onSubmit={handleSubmit} className="consult-form">
          {/* Full Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* City */}
          <div className="form-group">
            <label>Select City</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            >
              <option value="">-- Choose City --</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Karachi">Karachi</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="form-group">
            <button
              type="button"
              className="search-btn"
              onClick={handleSearch}
              disabled={!formData.city}
            >
              Search Available Doctors
            </button>
          </div>

          {/* Available Doctors */}
          {availableDoctors.length > 0 && (
            <div className="form-group doctor-list">
              <label>Available Psychologists:</label>
              <ul>
                {availableDoctors.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label>Brief Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your concerns or the type of help you need"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default Consult;
