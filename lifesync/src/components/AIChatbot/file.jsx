import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { auth } from "../../firebaseConfig"; // Import your Firebase config
import "../styles.css";

// Function to convert ANSI codes (like bold) to HTML
const parseANSIToHTML = (text) => {
  return text
    .replace(/\033\[1m/g, "<b>")
    .replace(/\033\[0m/g, "</b>")
    .replace(/\n/g, "<br/>");
};

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [userEmail, setUserEmail] = useState(""); // State to store the current user's email

  // Function to send message and store chat in DB
  const sendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to the state
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userInput, sender: "user" },
    ]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Send user message to the backend for bot response
      const response = await fetch("https://d110-34-125-217-143.ngrok-free.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput }),
      });

      const data = await response.json();
      const botResponse = data.response;

      // Add bot response to the state
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: botResponse, sender: "bot" },
      ]);

      // Save the chat (both user and bot messages) to the database
      await fetch("http://localhost:5003/saveChat", {  // Replace with your actual backend URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,  // Use the email of the current user
          userMessage: userInput,
          botResponse: botResponse,
        }),
      });

    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "An error occurred. Please try again.", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChats = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email); // Set the email of the logged-in user

        // Fetch previous chats from the database
        try {
          const response = await fetch(`http://localhost:5003/getChats/${user.email}`);
          const data = await response.json();
          if (data.chats) {
            // Structure messages as separate user and bot entries
            const structuredMessages = data.chats.flatMap(chat => {
              const userMessage = { text: chat.userMessage, sender: "user" };
              const botMessage = { text: chat.botResponse, sender: "bot" };
              return [userMessage, botMessage];
            });
            setMessages(structuredMessages); // Set structured messages
          }
        } catch (error) {
          console.error("Error fetching chats:", error);
        }
      }
    };

    fetchChats();
  }, []); // Empty dependency array means it runs once after initial render

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // The effect runs whenever messages change

  return (

    
    <div className="chatbot-fullscreen-container">
      {/* Fixed Header */}
      <header className="chatbot-fixed-header">
        <h2 className="wellness-title">
          Mental <span className="highlight">Health</span> Chatbot
        </h2>
        <p className="wellness-subtitle">
          Tools to support your mental well-being
        </p>
      </header>

      {/* Sidebar + Main Chat Area */}
      <div className="chatbot-body">
        {/* Sidebar */}
        <aside className="chatbot-sidebar">
          <button className="sidebar-btn">🆕 New Chat</button>
          <button className="sidebar-btn">📜 Previous Chats</button>
          <button className="sidebar-btn delete">🗑️ Delete Chat</button>
        </aside>

        {/* Main Chat Area */}
        <motion.div
          className="chatbot-chat-area"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          viewport={{ once: false, amount: 0.2 }}
        >
          {/* Scrollable Chat Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.sender}`}
                dangerouslySetInnerHTML={{
                  __html:
                    msg.sender === "bot"
                      ? parseANSIToHTML(msg.text)
                      : msg.text,
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

          {/* Input Area */}
          <div className="chatbot-input">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Chatbot;
