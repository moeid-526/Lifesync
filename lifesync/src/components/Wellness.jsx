import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import chatbotImg from "../assets/chatbot.png";
import journalImg from "../assets/journal-keeping.png";
import reportGenImg from "../assets/reportGen.png";
import timeCapImg from "../assets/timeCap.png";
import blockchainImg from "../assets/blockchain.png"
import './styles.css';

const Wellness = () => {
  const navigate = useNavigate();

  return (
    <motion.section
      className="wellness-section"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <h2 className="mn-head">
        Your <span className="mn-high">Wellness</span> Hub
      </h2>
      <p className="mn-sub">
        Tools to support your mental health
      </p>

      <div className="wellness-content">
        {[
          {
            img: chatbotImg,
            title: "Mental Health Chatbot",
            desc: "Interact with our AI-powered chatbot for mental health support.",
            route: "/dashboard/chatbot", // Updated
          },
          {
            img: journalImg,
            title: "Journal Keeping",
            desc: "Write and keep track of your thoughts and reflections.",
            route: "/dashboard/journal", // Updated
          },{
            img: timeCapImg,
            title: "Time Capsule",
            desc: "Securely store your personal memories, thoughts, and moments with encryption and steganography.",
            route: "/dashboard/timecapsule", // Suggested route
          },
          {
            img: reportGenImg,
            title: "Generate Report",
            desc: "Track your emotional growth and receive AI-generated weekly progress insights.",
            route: "/dashboard/report", // Suggested route
          },
          {
            img: blockchainImg,
            title: "System Logs",
            desc: "View tamper-proof logs powered by blockchain to ensure privacy and transparency.",
            route: "/dashboard/systemlogs", // Suggested route
          },          
        ].map((item, index) => (
          <motion.div
            key={index}
            className="wellness-item"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            viewport={{ once: false, amount: 0.5 }}
            onClick={() => navigate(item.route)}
            style={{ cursor: 'pointer' }}
          >
            <img src={item.img} alt={item.title} />
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Wellness;
