import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, NavLink, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./styles.css";
import sleepImg from "../assets/sleep.png";
import communicationImg from "../assets/communication.png";
import relaxationImg from "../assets/relaxation.png";
import chatbotImg from "../assets/chatbot.png";
import journalImg from "../assets/journal-keeping.png";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from "recharts";

import GaugeChart from "react-gauge-chart";
import "react-circular-progressbar/dist/styles.css";
import { useActiveTimeTracker } from '../components/useActiveTimeTracker';

// Static fallback data
const STATIC_METRICS = {
  chatbotInteractions: 15,
  lastActive: "Just now",
  moodTrend: 12.5,
  journalEntries: 8,
  weeklyGoals: 3,
  communityEngagement: 5,
  chatbotInteractionsPerDay: [
    { day: "Mon", count: 2 },
    { day: "Tue", count: 3 },
    { day: "Wed", count: 4 },
    { day: "Thu", count: 1 },
    { day: "Fri", count: 3 },
    { day: "Sat", count: 1 },
    { day: "Sun", count: 1 }
  ],
  activeTimePerDay: [
    { day: "Mon", time: 45, minutes: 45 },
    { day: "Tue", time: 60, minutes: 60 },
    { day: "Wed", time: 30, minutes: 30 },
    { day: "Thu", time: 75, minutes: 75 },
    { day: "Fri", time: 50, minutes: 50 },
    { day: "Sat", time: 90, minutes: 90 },
    { day: "Sun", time: 40, minutes: 40 }
  ],
  moodData: [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), value: 3 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), value: 4 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), value: 2 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), value: 5 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), value: 4 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), value: 3 },
    { date: new Date(), value: 4 }
  ]
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profilePicture, setProfilePicture] = useState('');
  const [quote, setQuote] = useState("");
  const [metrics, setMetrics] = useState(STATIC_METRICS);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Add sidebar toggle function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);

  const handleEmailToggle = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newState = !emailNotificationsEnabled;
    setEmailNotificationsEnabled(newState);

    try {
      // Update user's email preference in your database
      await axios.post(`http://localhost:5008/email-preference`, {
        userId: user.uid,
        email: user.email,
        emailNotificationsEnabled: newState
      });
      toast.success(`Email notifications ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error updating email preference:", error);
      // Revert if update fails
      setEmailNotificationsEnabled(!newState);
      toast.error("Failed to update email preference");
    }
  };

  const fetchEmailPreference = async (uid) => {
    try {
      const response = await axios.get(`http://localhost:5008/email-preference/${uid}`);
      return response.data.emailNotificationsEnabled || false;
    } catch (error) {
      console.error("Error fetching email preference:", error);
      return false;
    }
  };

  // Add this useEffect to listen for the custom event
  useEffect(() => {
    const handleProfilePictureChange = (event) => {
      setProfilePicture(event.detail.profilePicture);
    };

    window.addEventListener('profilePictureChanged', handleProfilePictureChange);

    return () => {
      window.removeEventListener('profilePictureChanged', handleProfilePictureChange);
    };
  }, []);

  // Add this useEffect hook to the Dashboard component
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Create an interval to check for profile picture updates
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5006/api/profile-picture?email=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const result = await response.json();
          setProfilePicture(result.profilePicture || '');
        }
      } catch (error) {
        console.error('Error checking profile picture:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useActiveTimeTracker(auth.currentUser?.uid);

  const [currentMood, setCurrentMood] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const showSidebar =
    location.pathname === "/dashboard" ||
    location.pathname === "/dashboard/profile" ||
    location.pathname === "/dashboard/wellness";

  const fullScreenRoutes = ["/dashboard/chatbot", "/dashboard/journal", "/dashboard/timecapsule", "/dashboard/systemlogs", "/dashboard/report"];
  const isFullScreen = fullScreenRoutes.includes(location.pathname);

  const calculateMoodTrend = (moodData) => {
    if (!moodData || moodData.length < 2) return 0;

    const moodScale = {
      angry: 1,
      sad: 2,
      neutral: 3,
      happy: 4,
    };

    const [prev, curr] = moodData.slice(-2);

    const getMoodValue = (mood) => {
      if (typeof mood.value === 'number') {
        return mood.value >= 1 && mood.value <= 4 ? mood.value : 0;
      }
      return moodScale[mood.value?.toString().toLowerCase()] || 0;
    };

    const prevValue = getMoodValue(prev);
    const currValue = getMoodValue(curr);

    if (!prevValue || !currValue) return 0;

    if (prevValue === 0) return currValue === 0 ? 0 : 100;

    const change = ((currValue - prevValue) / prevValue) * 100;
    return Math.round(change);
  };

  const fetchProfilePicture = async (email) => {
    try {
      const response = await fetch(`http://localhost:5006/api/profile-picture?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const result = await response.json();
        setProfilePicture(result.profilePicture || '');
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const fetchUserProgress = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5004/progress/${userId}`);
      const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const reorderedChatbotInteractions = orderedDays.map((day) => {
        const dayData = response.data.chatbotInteractionsPerDay?.find((item) => item.day === day);
        return dayData ? dayData : { day, count: 0 };
      });

      const reorderedActiveTimeData = orderedDays.map((day) => {
        const dayData = response.data.activeTimePerDay?.find((item) => item.day === day);
        return {
          day,
          time: dayData ? dayData.minutes : 0,
          minutes: dayData ? dayData.minutes : 0
        };
      });

      const moodTrend = calculateMoodTrend(response.data.moodData || []);

      setMetrics({
        ...response.data,
        moodTrend,
        journalEntries: response.data.journalEntries || 0,
        chatbotInteractionsPerDay: reorderedChatbotInteractions,
        activeTimePerDay: reorderedActiveTimeData,
        lastActive: response.data.lastActive || new Date(),
      });
      setUsingFallbackData(false);

    } catch (error) {
      console.error("Error fetching progress data:", error);
      toast.error("Failed to load progress data. Showing demo data.");
      
      // Use static data when server is down
      setMetrics(STATIC_METRICS);
      setUsingFallbackData(true);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error("User not logged in. Redirecting to login.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          await fetchProfilePicture(user.email);
          await fetchUserProgress(user.uid);

          // Fetch email preference
          const emailPref = await fetchEmailPreference(user.uid);
          setEmailNotificationsEnabled(emailPref);
        } else {
          toast.error("User data not found.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data. Using demo mode.");
        setUsingFallbackData(true);
      }
    };

    const fetchRandomQuote = async () => {
      try {
        const response = await fetch("http://localhost:5002/get-random-quote");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setQuote(data.quote);
      } catch (error) {
        console.error("Error fetching quote:", error);
        setQuote("Believe in yourself. You are stronger than you think.");
      }
    };

    fetchUserData();
    fetchRandomQuote();
  }, [navigate]);

  const handleMoodSubmit = async () => {
    if (!currentMood || !auth.currentUser) return;

    try {
      const moodValue = {
        happy: 5,
        neutral: 3,
        sad: 1,
        angry: 0,
      }[currentMood.toLowerCase()];

      await axios.post(`http://localhost:5004/mood`, {
        userId: auth.currentUser.uid,
        mood: moodValue,
        date: new Date().toISOString(),
      });

      toast.success("Mood recorded successfully!");
      fetchUserProgress(auth.currentUser.uid);
    } catch (error) {
      console.error("Error submitting mood:", error);
      toast.error("Failed to record mood. Data saved locally only.");
      
      // Update local state even if server is down
      const newMoodData = [...metrics.moodData, { date: new Date(), value: moodValue }];
      setMetrics(prev => ({
        ...prev,
        moodData: newMoodData,
        moodTrend: calculateMoodTrend(newMoodData)
      }));
    }
  };

  if (!userData) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (isFullScreen) {
    return <Outlet />;
  }

  return (
    <>
      <div className="dashboard-layout">
        {/* Add Sidebar Toggle Button */}
        <div
          className={`sidebar-toggle ${sidebarOpen ? 'open' : 'closed'}`}
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <FaAngleLeft size={20} /> : <FaAngleRight size={20} />}
        </div>
        {showSidebar && (
          <motion.div
            className={`sidebar ${sidebarOpen ? 'active' : ''}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="sidebar-header">
              <h2>Dashboard</h2>
            </div>
            <nav className="sidebar-nav">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
                end
              >
                Track Your Progress
              </NavLink>
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                Profile
              </NavLink>
              <NavLink
                to="/dashboard/wellness"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                Your Wellness Hub
              </NavLink>
            </nav>
          </motion.div>
        )}

        <motion.div
          className="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {location.pathname !== "/dashboard" ? (
            <Outlet />
          ) : (
            <>
              

              {/* --- HEADER --- */}
              <motion.div
                className="dashboard-header-container"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="dashboard-header-content">
                  <div className="welcome-message">
                    <h1>
                      Welcome Back,{" "}
                      <span className="username">{userData.username}</span>
                    </h1>
                    <p className="greeting-message">
                      Ready for today's wellness boost?
                    </p>
                  </div>
                  <div className="header-actions">
                    <motion.div
                      className="email-toggle-switch"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={emailNotificationsEnabled}
                          onChange={handleEmailToggle}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-label">
                        {emailNotificationsEnabled ? 'Email On' : 'Email Off'}
                      </span>
                    </motion.div>
                    <div className="user-avatar">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-circle">
                          {userData.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="header-divider"></div>
              </motion.div>

              {/* --- AFFIRMATION --- */}
              <motion.section
                className="affirmation-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6 }}
              >
                <div className="affirmation-content">
                  <div className="quote-icon">✨</div>
                  <div>
                    <h2 className="quote-title">Today's Affirmation</h2>
                    <p className="quote-text">"{quote}"</p>
                  </div>
                </div>
                <motion.button
                  className="refresh-quote"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    try {
                      const response = await fetch("http://localhost:5002/get-random-quote");
                      if (!response.ok) throw new Error("Network response was not ok");
                      const data = await response.json();
                      setQuote(data.quote);
                      toast.success("Quote refreshed!");
                    } catch (error) {
                      console.error("Error fetching quote:", error);
                      toast.error("Failed to refresh quote");
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C15.76 2 19 4.24 20.65 7.35M22 4V8H18"
                      stroke="#a90707"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Refresh
                </motion.button>
              </motion.section>

              {/* Updated Progress Metrics Section with Dynamic Data */}
              <motion.section
                className="progress-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
              >
                <h2 className="mn-head">
                  Track <span className="mn-high">Your</span> Growth
                </h2>
                <p className="mn-sub">Visualize how far you've come</p>

                <div className="progress-charts-grid two-per-row">
                  {/* Chatbot Interactions - Bar Chart */}
                  <div className="progress-card">
                    <h3>🤖 Chatbot Interactions</h3>
                    <div className="chart-container">
                      <BarChart
                        width={500}
                        height={250}
                        data={metrics.chatbotInteractionsPerDay}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <XAxis dataKey="day" interval={0} tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#a90707"
                          barSize={30}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </div>
                    <p className="bar-card-footer">
                      {metrics.chatbotInteractions} total interactions
                      {usingFallbackData && <span className="demo-badge">Demo</span>}
                    </p>
                  </div>

                  {/* Time Active Per Day - Scatter Chart */}
                  <div className="progress-card">
                    <h3>⏱️ Time Active Per Day</h3>
                    <div className="chart-container">
                      <ScatterChart width={500} height={250} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          name="Day"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="time"
                          name="Active Time"
                          unit=" min"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          labelFormatter={(day) => `Day: ${day}`}
                        />
                        <Scatter
                          name="Active Time"
                          data={metrics.activeTimePerDay}
                          fill="#a90707"
                          shape="circle"
                        />
                      </ScatterChart>
                    </div>
                    <p className="scatter-card-footer">
                      Each point shows minutes spent on the platform
                      {usingFallbackData && <span className="demo-badge">Demo</span>}
                    </p>
                  </div>

                  {/* Mood Trend - Gauge Chart */}
                  <div className="progress-card mood-card">
                    <h3 className="card-title">😊 Mood Trend</h3>
                    <GaugeChart
                      id="mood-gauge"
                      nrOfLevels={10}
                      percent={metrics.moodData.length > 0 ?
                        metrics.moodData[metrics.moodData.length - 1].value / 5 : 0.5}
                      colors={["#FF6A6A", "#FFA500", "#00C49F"]}
                      arcWidth={0.3}
                      needleColor="#2c3e50"
                      textColor="#2c3e50"
                      animate={true}
                      width={250}
                      height={250}
                    />
                    <p className="card-footer mood-footer">
                      {metrics.moodTrend > 0 ? '↑' : '↓'} {Math.abs(metrics.moodTrend).toFixed(1)}%
                      {usingFallbackData}
                    </p>
                  </div>

                  {/* Journal Entries - Radial Bar Chart */}
                  <div className="progress-card journal-card">
                    <h3 className="card-title">📔 Journal Entries</h3>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="100%"
                      barSize={20}
                      width={250}
                      height={250}
                      data={[
                        {
                          name: "Journal Entries",
                          value: Math.min(metrics.journalEntries, 1000),
                          fill: "#a90707",
                        },
                        {
                          name: "Max",
                          value: 100,
                          fill: "#f0f0f0"
                        }
                      ]}
                    >
                      <RadialBar
                        minAngle={15}
                        background
                        clockWise
                        dataKey="value"
                        cornerRadius={12}
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="progress-label"
                      >
                        {Math.round((metrics.journalEntries / 100) * 100)}%
                      </text>
                      <Tooltip
                        content={({ payload }) => {
                          if (payload && payload[0]) {
                            return (
                              <div className="custom-tooltip">
                                <p>{`${payload[0].payload.value}/${1000} entries`}</p>
                                <p>{`${Math.round((payload[0].payload.value / 1000) * 100)}% complete`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          padding: "10px",
                        }}
                      />
                    </RadialBarChart>
                    <p className="journal-footer">
                      ✍️ {metrics.journalEntries} entries logged
                      {metrics.journalEntries >= 100 && (
                        <span className="milestone-badge">Milestone Achieved!</span>
                      )}
                      {usingFallbackData && <span className="demo-badge">Demo</span>}
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Mood Tracker Section - Now Functional */}
              <motion.section
                className="mood-tracker-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
              >
                <h2 className="mn-head">
                  How <span className="mn-high">You</span> Feel?
                </h2>
                <p className="mn-sub">
                  Track your mood to see emotional patterns over time.
                </p>

                <div className="mood-options">
                  {['Happy', 'Neutral', 'Sad', 'Angry'].map((mood) => (
                    <button
                      key={mood}
                      className={`mood-option ${currentMood === mood ? 'selected' : ''}`}
                      onClick={() => setCurrentMood(mood)}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
                <button
                  className="submit-mood"
                  onClick={handleMoodSubmit}
                  disabled={!currentMood}
                >
                  ✔ Submit Mood
                </button>
              </motion.section>

              {/* Existing Sections (Updated for 2-column layout) */}
              <motion.section
                className="healthy-lifestyle-section"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.3 }}
              >
                <h2 className="mn-head">
                  Healthy <span className="mn-high">Lifestyle</span> Tips
                </h2>
                <p className="mn-sub">
                  Simple ways to improve your daily well-being
                </p>

                <div className="lifestyle-content">
                  {[
                    {
                      img: sleepImg,
                      title: "Quality Sleep",
                      desc: "Aim for 7-9 hours of sleep each night to refresh your mind and body.",
                    },
                    {
                      img: communicationImg,
                      title: "Stay Connected",
                      desc: "Engage in meaningful conversations to boost mental wellness.",
                    },
                    {
                      img: relaxationImg,
                      title: "Relax & Recharge",
                      desc: "Practice mindfulness, yoga, or deep breathing exercises daily.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="lifestyle-item"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.2 }}
                      viewport={{ once: false, amount: 0.5 }}
                    >
                      <img src={item.img} alt={item.title} />
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </>
          )}
        </motion.div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Dashboard;
