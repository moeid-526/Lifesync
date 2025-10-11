import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { auth } from "../firebaseConfig";
import "../components/styles.css";

const faqData = [
    {
      question: "What is LifeSync?",
      answer: "LifeSync is your personal wellness companion, helping you track emotional health, journal thoughts, and explore mental clarity tools using AI and blockchain tech. Our platform combines cutting-edge technology with psychological insights to support your mental wellbeing journey."
    },
    {
      question: "Is my data safe and private?",
      answer: "Absolutely! We use military-grade end-to-end encryption, blockchain audit logs, and steganography techniques to keep your personal reflections and insights completely confidential. Your data never leaves your device without encryption, and we never sell or share your information."
    },
    {
      question: "Can I talk to the AI anytime?",
      answer: "Yes, our Mental Health Chatbot is available 24/7 to support you through stress, anxiety, or just casual reflection. The AI adapts to your communication style and remembers your conversation history (unless you choose to delete it) to provide personalized support."
    },
    {
      question: "What makes LifeSync different from other wellness apps?",
      answer: "LifeSync uniquely combines: (1) Emotion tracking with AI analysis, (2) Secure blockchain journaling, (3) Steganography time capsules, and (4) Personalized growth plans. We focus on long-term mental wellness rather than quick fixes."
    },
    {
      question: "What is the Time Capsule feature?",
      answer: "The Time Capsule lets you store thoughts, emotions, and memories securely using image encryption. You can set future opening dates (from 1 month to 10 years) to reflect on your personal growth journey. Capsules are encrypted and stored decentralized for maximum security."
    },
    {
      question: "Do I get emotional progress reports?",
      answer: "Yes! Our AI analyzes patterns in your journal entries, mood logs, and chatbot interactions to generate weekly Mental Wellness Reports. These include emotional trends, stress triggers, and personalized improvement suggestions - all available in your private dashboard."
    },
    {
      question: "How does the mood tracking work?",
      answer: "Our system uses a combination of your manual inputs and AI analysis of your journal entries to track emotional states. Over time, it identifies patterns and can even predict potential mood dips before they happen, suggesting proactive self-care activities."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Yes! LifeSync is available on both iOS and Android with full feature parity. Your data syncs seamlessly across all devices using our secure encrypted cloud storage. Download links are available in your account dashboard."
    },
    {
      question: "What subscription plans are available?",
      answer: "We offer: (1) Free tier with basic features, (2) Premium ($9.99/mo) with advanced analytics and unlimited time capsules, and (3) Family Plan ($24.99/mo) covering up to 5 members. All plans include the same rigorous security standards."
    },
    {
      question: "How can I delete my account?",
      answer: "You can delete your account anytime in Settings > Account. This triggers our 30-day GDPR-compliant deletion process that permanently erases all your data from our systems. You'll receive email confirmation when complete."
    }
  ];
const FAQs = () => {
  const [activeIndices, setActiveIndices] = useState([]);

  const toggleAccordion = (index) => {
    setActiveIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleContactSupport = () => {
    const user = auth.currentUser;
    const recipient = "teamlifesync@gmail.com";
    const subject = encodeURIComponent("LifeSync Support Request");
    const body = encodeURIComponent(
      `Hello LifeSync Team,\n\nI need assistance with:\n\n[Please describe your issue here]\n\n` +
      (user ? `My account email: ${user.email}\nUser ID: ${user.uid}` : "")
    );

    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
    
    window.open(mailtoLink, "_blank");
  };

  return (
    <motion.div 
      className="faq-page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="faq-header">
        <motion.h1 
          className="mn-head"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Frequently <span className="mn-high">Asked</span> Questions
        </motion.h1>
        <p className="mn-sub">
          Everything you need to know about LifeSync and your wellness journey
        </p>
      </div>

      <div className="faq-content-container">
        <div className="faq-grid">
          {faqData.map((faq, index) => (
            <motion.div 
              key={index}
              className={`faq-card ${activeIndices.includes(index) ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <button
                className="faq-question"
                onClick={() => toggleAccordion(index)}
                aria-expanded={activeIndices.includes(index)}
              >
                <span>{faq.question}</span>
                {activeIndices.includes(index) ? (
                  <FaChevronUp className="faq-icon" />
                ) : (
                  <FaChevronDown className="faq-icon" />
                )}
              </button>
              <motion.div
                className="faq-answer-container"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: activeIndices.includes(index) ? 'auto' : 0,
                  opacity: activeIndices.includes(index) ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="faq-answer">{faq.answer}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="faq-contact-card">
          <h3>Still have questions?</h3>
          <p>Our support team is available 24/7 to help you with any inquiries.</p>
          <motion.button
            className="contact-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContactSupport}
          >
            Contact Support
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FAQs;