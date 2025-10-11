import React, { useEffect, useState, useRef } from "react";
import { auth } from "../../firebaseConfig";
import { motion } from "framer-motion";
import "../styles.css";
import axios from 'axios';

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
  const [selectedModel, setSelectedModel] = useState("llama");

  const messagesEndRef = useRef(null);

  const predefinedResponses = {
    "who are you": "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "what is your role": "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "tell me about yourself": "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "are you a chatbot": "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "what can i call you": "I am the LifeSync Mental Health Assistant, designed to support your emotional well-being and personal growth.",
    "who integrated you": "I was integrated by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan, students of BSIT at the National University of Modern Languages (NUML), Islamabad Main Campus.",
    "who built you into this system": "I was integrated by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan, students of BSIT at the National University of Modern Languages (NUML), Islamabad Main Campus.",
    "who connected you with lifesync": "I was integrated by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan, students of BSIT at the National University of Modern Languages (NUML), Islamabad Main Campus.",
    "which team added you to lifesync": "I was integrated by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan, students of BSIT at the National University of Modern Languages (NUML), Islamabad Main Campus.",
    "what is lifesync": "LifeSync is a digital platform designed to support mental and emotional well-being through AI-powered tools, secure data storage, and reflective journaling.",
    "can you tell me about lifesync": "LifeSync is a digital platform designed to support mental and emotional well-being through AI-powered tools, secure data storage, and reflective journaling.",
    "describe lifesync": "LifeSync is a digital platform designed to support mental and emotional well-being through AI-powered tools, secure data storage, and reflective journaling.",
    "what kind of platform is lifesync": "LifeSync is a digital platform designed to support mental and emotional well-being through AI-powered tools, secure data storage, and reflective journaling.",
    "how can you help me": "I can help you manage stress, explore your emotions, reflect on your thoughts, and offer positive affirmations to support your mental health journey.",
    "what can you do for me": "I can help you manage stress, explore your emotions, reflect on your thoughts, and offer positive affirmations to support your mental health journey.",
    "in what way are you useful": "I can help you manage stress, explore your emotions, reflect on your thoughts, and offer positive affirmations to support your mental health journey.",
    "how do you support users": "I can help you manage stress, explore your emotions, reflect on your thoughts, and offer positive affirmations to support your mental health journey.",
    "what are your features": "My features include an AI-driven mental health chatbot, secure Time Capsule for memories, emotional progress tracking, weekly wellness reports, and motivational reflections.",
    "what tools do you offer": "My features include an AI-driven mental health chatbot, secure Time Capsule for memories, emotional progress tracking, weekly wellness reports, and motivational reflections.",
    "list your features": "My features include an AI-driven mental health chatbot, secure Time Capsule for memories, emotional progress tracking, weekly wellness reports, and motivational reflections.",
    "what makes you special": "My features include an AI-driven mental health chatbot, secure Time Capsule for memories, emotional progress tracking, weekly wellness reports, and motivational reflections.",
    "are you a real therapist": "I'm not a licensed therapist, but I'm trained to offer supportive, therapeutic-style conversations. If you're in crisis, please seek help from a professional.",
    "are you a certified counselor": "I'm not a licensed therapist, but I'm trained to offer supportive, therapeutic-style conversations. If you're in crisis, please seek help from a professional.",
    "can you replace a therapist": "I'm not a licensed therapist, but I'm trained to offer supportive, therapeutic-style conversations. If you're in crisis, please seek help from a professional.",
    "are you a professional psychologist": "I'm not a licensed therapist, but I'm trained to offer supportive, therapeutic-style conversations. If you're in crisis, please seek help from a professional.",
    "who developed this platform": "LifeSync was developed by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan from BSIT at NUML Islamabad. They integrated advanced technologies like AI and blockchain to enhance emotional well-being.",
    "who made lifesync": "LifeSync was developed by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan from BSIT at NUML Islamabad. They integrated advanced technologies like AI and blockchain to enhance emotional well-being.",
    "which team created lifesync": "LifeSync was developed by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan from BSIT at NUML Islamabad. They integrated advanced technologies like AI and blockchain to enhance emotional well-being.",
    "who is behind lifesync": "LifeSync was developed by Moeid Abdul Hayee, Nasir Sharif, and Muzammil Khan from BSIT at NUML Islamabad. They integrated advanced technologies like AI and blockchain to enhance emotional well-being.",
    "is my data private": "Yes, your data is stored securely. We use encryption and blockchain-backed logs to ensure integrity and privacy.",
    "do you protect my data": "Yes, your data is stored securely. We use encryption and blockchain-backed logs to ensure integrity and privacy.",
    "is my information secure": "Yes, your data is stored securely. We use encryption and blockchain-backed logs to ensure integrity and privacy.",
    "is my personal data safe here": "Yes, your data is stored securely. We use encryption and blockchain-backed logs to ensure integrity and privacy.",
    "is this platform secure": "Absolutely. LifeSync prioritizes security and transparency using encryption, data masking, and blockchain to prevent tampering or unauthorized access.",
    "can i trust this platform": "Absolutely. LifeSync prioritizes security and transparency using encryption, data masking, and blockchain to prevent tampering or unauthorized access.",
    "is lifesync safe to use": "Absolutely. LifeSync prioritizes security and transparency using encryption, data masking, and blockchain to prevent tampering or unauthorized access.",
    "is it safe here": "Absolutely. LifeSync prioritizes security and transparency using encryption, data masking, and blockchain to prevent tampering or unauthorized access.",
    "will my chats be saved": "Yes, your chats are securely stored to help track emotional trends over time and improve personalized support.",
    "do you keep a record of chats": "Yes, your chats are securely stored to help track emotional trends over time and improve personalized support.",
    "are my messages stored": "Yes, your chats are securely stored to help track emotional trends over time and improve personalized support.",
    "do you save what i say": "Yes, your chats are securely stored to help track emotional trends over time and improve personalized support.",
    "what is the ai time capsule": "The AI Time Capsule lets you preserve your memories, emotions, and reflections securely using steganography, so you can revisit them in the future.",
    "explain the time capsule feature": "The AI Time Capsule lets you preserve your memories, emotions, and reflections securely using steganography, so you can revisit them in the future.",
    "what does the ai time capsule do": "The AI Time Capsule lets you preserve your memories, emotions, and reflections securely using steganography, so you can revisit them in the future.",
    "can you tell me about time capsule": "The AI Time Capsule lets you preserve your memories, emotions, and reflections securely using steganography, so you can revisit them in the future.",
    "can i trust lifesync": "LifeSync was built with your privacy and mental wellness in mind. The team has taken every step to ensure your data remains safe and your experience is supportive.",
    "is lifesync reliable": "LifeSync was built with your privacy and mental wellness in mind. The team has taken every step to ensure your data remains safe and your experience is supportive.",
    "should i trust this system": "LifeSync was built with your privacy and mental wellness in mind. The team has taken every step to ensure your data remains safe and your experience is supportive.",
    "is lifesync a trustworthy platform": "LifeSync was built with your privacy and mental wellness in mind. The team has taken every step to ensure your data remains safe and your experience is supportive.",
    "what if i upload something unsafe": "LifeSync uses a Vision Guard feature that scans uploaded images for inappropriate content. If harmful content is detected, it's blocked to ensure user safety.",
    "what happens if i post bad content": "LifeSync uses a Vision Guard feature that scans uploaded images for inappropriate content. If harmful content is detected, it's blocked to ensure user safety.",
    "is there a filter for dangerous images": "LifeSync uses a Vision Guard feature that scans uploaded images for inappropriate content. If harmful content is detected, it's blocked to ensure user safety.",
    "can i upload anything": "LifeSync uses a Vision Guard feature that scans uploaded images for inappropriate content. If harmful content is detected, it's blocked to ensure user safety.",
    "what is vision guard": "Vision Guard is an AI-powered system that scans uploaded images for explicit or harmful content such as nudity or weapons, blocking them for your safety.",
    "explain vision guard": "Vision Guard is an AI-powered system that scans uploaded images for explicit or harmful content such as nudity or weapons, blocking them for your safety.",
    "how do you detect unsafe content": "Vision Guard is an AI-powered system that scans uploaded images for explicit or harmful content such as nudity or weapons, blocking them for your safety.",
    "what tool checks the images": "Vision Guard is an AI-powered system that scans uploaded images for explicit or harmful content such as nudity or weapons, blocking them for your safety.",
    "do you offer motivational quotes": "Yes! I can provide daily affirmations and motivational quotes to help lift your mood and inspire reflection.",
    "can i get some affirmations": "Yes! I can provide daily affirmations and motivational quotes to help lift your mood and inspire reflection.",
    "give me something inspiring": "Yes! I can provide daily affirmations and motivational quotes to help lift your mood and inspire reflection.",
    "do you have positive quotes": "Yes! I can provide daily affirmations and motivational quotes to help lift your mood and inspire reflection.",
    "how do you track my mental health": "Your progress is tracked based on your chats, journaling, and mood patterns. Over time, I generate weekly wellness reports tailored to you.",
    "do you monitor my emotions": "Your progress is tracked based on your chats, journaling, and mood patterns. Over time, I generate weekly wellness reports tailored to you.",
    "how is my progress analyzed": "Your progress is tracked based on your chats, journaling, and mood patterns. Over time, I generate weekly wellness reports tailored to you.",
    "can you track my emotional state": "Your progress is tracked based on your chats, journaling, and mood patterns. Over time, I generate weekly wellness reports tailored to you.",
    "how does the journaling feature work": "You can reflect in your journal anytime. Your entries are stored securely and used to personalize feedback and progress tracking.",
    "tell me how to journal here": "You can reflect in your journal anytime. Your entries are stored securely and used to personalize feedback and progress tracking.",
    "can i write my thoughts": "You can reflect in your journal anytime. Your entries are stored securely and used to personalize feedback and progress tracking.",
    "how can i reflect using lifesync": "You can reflect in your journal anytime. Your entries are stored securely and used to personalize feedback and progress tracking.",
    "what kind of reflections do you offer": "I can offer personalized reflections based on your mood, past conversations, and emotional trends, designed to help you grow and understand yourself better.",
    "can you reflect on my mood": "I can offer personalized reflections based on your mood, past conversations, and emotional trends, designed to help you grow and understand yourself better.",
    "do you give feedback": "I can offer personalized reflections based on your mood, past conversations, and emotional trends, designed to help you grow and understand yourself better.",
    "what can i learn from your reflections": "I can offer personalized reflections based on your mood, past conversations, and emotional trends, designed to help you grow and understand yourself better.",
    "do you share my data with anyone": "No, your data stays with you. LifeSync does not share your data with third parties.",
    "is my data shared": "No, your data stays with you. LifeSync does not share your data with third parties.",
    "will others see my information": "No, your data stays with you. LifeSync does not share your data with third parties.",
    "do you send my info to anyone": "No, your data stays with you. LifeSync does not share your data with third parties.",
    "who owns the data i enter": "You own your data. LifeSync simply stores it securely so you can access and reflect on it whenever you want.",
    "is my data mine": "You own your data. LifeSync simply stores it securely so you can access and reflect on it whenever you want.",
    "who has control of my data": "You own your data. LifeSync simply stores it securely so you can access and reflect on it whenever you want.",
    "do i have ownership of my data": "You own your data. LifeSync simply stores it securely so you can access and reflect on it whenever you want."
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
        botMessage
      });
    } catch (err) {
      console.error("Failed to log interaction:", err);
    }
  };


  const getKerasResponse = async (inputText) => {
    try {
      const response = await fetch('http://localhost:5009/keras-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText })
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting Keras response:', error);
      return "Sorry, I'm having trouble connecting to the Keras model. Please try again later.";
    }
  };

// ✅ Updated sendMessage function
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

    // --- Predefined responses ---
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

      // ✅ Log immediately after bot response
      await logInteraction(userMessage.text, botMessage.text);

    } else {
      setIsFetchingFromBackend(true);
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 5000));

      if (selectedModel === "llama") {
        const backendFetch = fetch("https://9a90-34-90-65-155.ngrok-free.app/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        }).then((response) => response.json());

        const [_, data] = await Promise.all([minLoadingTime, backendFetch]);
        const botMessage = { sender: "bot", text: data.response };
        setMessages((prev) => [...prev, botMessage]);

        // ✅ Log interaction
        await logInteraction(userMessage.text, botMessage.text);

      } else {
        const kerasResponse = await getKerasResponse(input);
        const botMessage = { sender: "bot", text: kerasResponse };
        setMessages((prev) => [...prev, botMessage]);

        // ✅ Log interaction
        await logInteraction(userMessage.text, botMessage.text);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    const botMessage = {
      sender: "bot",
      text: "Sorry, something went wrong. Try again later.",
    };
    setMessages((prev) => [...prev, botMessage]);

    // ✅ Even log errors as interactions (optional)
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

  const toggleChatsVisibility = () => {
    setIsChatsVisible((prevState) => !prevState);
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
  };



  return (
    <div className="dashboard-layout-chatbot">
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
                  className={`nav-item-chatbot chat-entry ${chat._id === activeChatId ? "active" : ""}`}
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

      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2 className="mn-head">
            Mental <span className="mn-high">Health</span> Chatbot
          </h2>
          <p className="mn-sub">Tools to support your mental well-being</p>
          <div className="current-model-indicator">
            Current Model: <span className="model-name">{selectedModel === "llama" ? "Llama" : "Keras"}</span>
          </div>
        </div>

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
                  __html: msg.sender === "bot" ? parseANSIToHTML(msg.text) : msg.text,
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

        <div className="chatbot-input-container">
          <div className="model-dropdown">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              <option value="llama">Llama Model</option>
              <option value="keras">Keras Model</option>
            </select>
          </div>

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
