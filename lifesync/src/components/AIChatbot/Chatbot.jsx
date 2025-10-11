import React, { useEffect, useState, useRef } from "react";
import { auth } from "../../firebaseConfig";
import { motion } from "framer-motion";
import "../styles.css";
import axios from "axios";
import { FaCamera, FaUpload, FaImage, FaTimes } from "react-icons/fa";

const parseANSIToHTML = (text) => {
  return text
    .replace(/\033\[1m/g, "<b>")
    .replace(/\033\[0m/g, "</b>")
    .replace(/\n/g, "<br/>");
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [previousChats, setPreviousChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isChatsVisible, setIsChatsVisible] = useState(false);
  const [isFetchingFromBackend, setIsFetchingFromBackend] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const messagesEndRef = useRef(null);

  const predefinedResponses = {
    "who are you":
      "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "what is your role":
      "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "what is lifesync":
      "LifeSync is a digital platform designed to support mental and emotional well-being through AI-powered tools, secure data storage, and reflective journaling.",
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email);
      fetchUserChats(currentUser.email);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserChats = async (email) => {
    try {
      const response = await fetch(`http://localhost:5003/getSessions/${email}`);
      const data = await response.json();
      setPreviousChats(data);
    } catch (error) {
      console.error("Error fetching user chat sessions:", error);
    }
  };

  const fetchChatById = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:5003/getSession/${chatId}`);
      const data = await response.json();
      if (data) {
        setMessages(data);
        setActiveChatId(chatId);
      }
    } catch (error) {
      console.error("Error fetching chat by ID:", error);
    }
  };

  const saveCurrentChatSession = async () => {
    if (messages.length === 0) return;
    try {
      await fetch("http://localhost:5003/saveSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, messages }),
      });
    } catch (error) {
      console.error("Error saving chat session:", error);
    }
  };

  const startNewChat = async () => {
    if (!activeChatId && messages.length > 0) {
      await saveCurrentChatSession();
    }
    setMessages([]);
    setActiveChatId(null);
    fetchUserChats(userEmail);
  };

  const logInteraction = async (userMessage, botMessage) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await axios.post("http://localhost:5004/chatbot-interaction", {
        userId,
        userMessage,
        botMessage,
      });
    } catch (err) {
      console.error("Failed to log interaction:", err);
    }
  };

  const getGeminiResponse = async (inputText) => {
    try {
      const response = await fetch("http://localhost:5012/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inputText }),
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error connecting to Gemini:", error);
      return "Sorry, I'm having trouble connecting to the Gemini model.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      let responseFound = false;
      let responseText = "";

      for (const [question, answer] of Object.entries(predefinedResponses)) {
        if (lowerInput.includes(question)) {
          responseText = answer;
          responseFound = true;
          break;
        }
      }

      if (responseFound) {
        const botMessage = { sender: "bot", text: responseText };
        setMessages((prev) => [...prev, botMessage]);
        await logInteraction(userMessage.text, botMessage.text);
      } else {
        setIsFetchingFromBackend(true);
        const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 3000));
        const backendFetch = fetch("http://localhost:5012/gemini-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        }).then((response) => response.json());

        const [_, data] = await Promise.all([minLoadingTime, backendFetch]);
        const botMessage = { sender: "bot", text: data.response };
        setMessages((prev) => [...prev, botMessage]);
        await logInteraction(userMessage.text, botMessage.text);
      }
    } catch (error) {
      console.error("Error:", error);
      const botMessage = {
        sender: "bot",
        text: "Sorry, something went wrong. Try again later.",
      };
      setMessages((prev) => [...prev, botMessage]);
      await logInteraction(userMessage.text, botMessage.text);
    } finally {
      setIsFetchingFromBackend(false);
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:5003/deleteSession/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPreviousChats((prevChats) =>
          prevChats.filter((chat) => chat._id !== chatId)
        );
        if (chatId === activeChatId) {
          setMessages([]);
          setActiveChatId(null);
        }
      } else {
        console.error("Error deleting chat session");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const toggleChatsVisibility = () => setIsChatsVisible((prev) => !prev);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setIsPopupOpen(false);
    }
  };

  const openCamera = () => {
    alert("Camera feature will be implemented soon!");
    setIsPopupOpen(false);
  };

  return (
    <div className="dashboard-layout-chatbot">
      {/* Sidebar */}
      <motion.div
        className="sidebar"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sidebar-header">
          <h2>Chat</h2>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item-chatbot new-chat-button" onClick={startNewChat}>
            + New Chat
          </button>

          <div className="nav-item-chatbot toggle-area" onClick={toggleChatsVisibility}>
            <strong>Previous Chats</strong>
            <span className={`arrow ${isChatsVisible ? "up" : "down"}`} />
          </div>

          {isChatsVisible && (
            <div className="previous-chats-list">
              {previousChats.map((chat, index) => (
                <div
                  key={chat._id}
                  className={`nav-item-chatbot chat-entry ${chat._id === activeChatId ? "active" : ""
                    }`}
                >
                  <div
                    className="chat-entry-content"
                    onClick={() => fetchChatById(chat._id)}
                  >
                    Chat {previousChats.length - index}
                    <br />
                    <small>{new Date(chat.createdAt).toLocaleString()}</small>
                  </div>
                  <button
                    className="delete-chat-button"
                    onClick={() => deleteChat(chat._id)}
                    title="Delete Chat"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </nav>
      </motion.div>

      {/* Chat Area */}
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2 className="mn-head">
            Mental <span className="mn-high">Health</span> Chatbot
          </h2>
          <p className="mn-sub">Tools to support your mental well-being</p>
        </div>

        {/* Messages */}
        <motion.div
          className="chatbot-messages-container"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          viewport={{ once: false, amount: 0.2 }}
        >
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.sender}`}
                dangerouslySetInnerHTML={{
                  __html:
                    msg.sender === "bot" ? parseANSIToHTML(msg.text) : msg.text,
                }}
              />
            ))}
            {isLoading && (
              <div className="chatbot-message bot">
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        {/* Input + Facial Analysis */}
        <div className="chatbot-input-container">
          {!activeChatId && (
            <div className="facial-analysis-area">
              <button
                className="facial-analysis-btn"
                onClick={() => setIsPopupOpen((prev) => !prev)}
              >
                <FaImage /> Facial Analysis
              </button>

              {isPopupOpen && <div className="popup-overlay"></div>}

              {isPopupOpen && (
                <div className="analysis-popup">
                  <div className="popup-header">
                    <span>Facial Analysis</span>
                    <FaTimes
                      className="close-popup-icon"
                      onClick={() => setIsPopupOpen(false)}
                    />
                  </div>
                  <div className="analysis-option" onClick={openCamera}>
                    <FaCamera /> Use Camera
                  </div>
                  <label className="analysis-option">
                    <FaUpload /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      hidden
                    />
                  </label>
                </div>
              )}
            </div>
          )}



          {selectedImage && (
            <>
              <div className="image-preview-overlay"></div> {/* background blur */}
              <div className="image-preview-container">
                <img src={selectedImage} alt="Selected" className="image-preview" />
                <div className="bot-btn-group">
                  <button
                    className="bot-image-btn"
                    onClick={async () => {
                      if (!selectedImage) return;

                      // Show user message “Analyzing your image...”
                      const userMessage = {
                        sender: "user",
                        text: "🧠 Analyzing your image...",
                      };
                      setMessages((prev) => [...prev, userMessage]);
                      setSelectedImage(null);

                      try {
                        const formData = new FormData();
                        const response = await fetch(selectedImage);
                        const blob = await response.blob();
                        formData.append("image", blob, "upload.jpg");

                        const res = await fetch("http://localhost:5012/analyze-face", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();

                        const botMessage = {
                          sender: "bot",
                          text: `<b>Detected Emotion:</b> ${data.emotion}<br/><br/>${data.response}`,
                        };

                        setMessages((prev) => [...prev, botMessage]);
                      } catch (err) {
                        console.error("Error analyzing image:", err);
                        const botMessage = {
                          sender: "bot",
                          text: "❌ Sorry, something went wrong while analyzing your image.",
                        };
                        setMessages((prev) => [...prev, botMessage]);
                      }
                    }}
                  >
                    Analyze
                  </button>

                  <button
                    className="bot-image-btn"
                    onClick={() => setSelectedImage(null)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </>
          )}


          {/* Text Input */}
          {activeChatId ? (
            <div className="viewing-chat-message">
              You are viewing a previous chat. Start a new chat to send messages.
            </div>
          ) : (
            <>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading}
              />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                {isLoading ? "Sending..." : "Send"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
