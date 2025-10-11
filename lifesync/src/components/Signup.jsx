import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProgressBar, Step } from "react-step-progress-bar";
import "react-step-progress-bar/styles.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const verificationRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const steps = [
    { id: 1, name: "Username", isComplete: username.trim() !== "" },
    { id: 2, name: "Email", isComplete: email.trim() !== "" },
    { id: 3, name: "Verify", isComplete: isVerified },
    { id: 4, name: "Password", isComplete: password.trim() !== "" },
    { id: 5, name: "Confirm", isComplete: confirmPassword.trim() !== "" },
  ];

  const calculateProgress = () => {
    const completedSteps = steps.filter(step => step.id <= currentStep && step.isComplete).length;
    return ((completedSteps - 1) / (steps.length - 1)) * 100;
  };
  
  const sendVerificationCode = async () => {
    if (!email) {
      toast.error("Please enter your email first.");
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch("http://localhost:5005/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setSentCode(data.code);
        toast.success("Verification code sent to your email.");
        setCurrentStep(3);
        setTimeout(() => verificationRef.current?.focus(), 100);
      } else {
        toast.error(data.message || "Failed to send verification code.");
      }
    } catch (error) {
      toast.error("Error sending verification code.");
      console.error(error);
    }
    setIsSending(false);
  };

  const handleVerification = () => {
    if (verificationCode === sentCode) {
      setIsVerified(true);
      toast.success("Email verified successfully!");
      setCurrentStep(4);
      setTimeout(() => passwordRef.current?.focus(), 100);
    } else {
      toast.error("Invalid verification code.");
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (field) {
        case "username":
          if (username.trim()) {
            setCurrentStep(2);
            setTimeout(() => emailRef.current?.focus(), 100);
          } else {
            toast.error("Username is required.");
          }
          break;
        case "password":
          if (password.trim()) {
            setCurrentStep(5);
            setTimeout(() => confirmPasswordRef.current?.focus(), 100);
          } else {
            toast.error("Password is required.");
          }
          break;
        case "confirm":
          if (confirmPassword.trim()) {
            // No next step to auto focus; just stay.
          } else {
            toast.error("Confirm Password is required.");
          }
          break;
        default:
          break;
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!isVerified) {
      toast.error("Please verify your email before signing up.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: user.email,
        createdAt: new Date(),
        isEmailVerified: true
      });
      await auth.signOut();
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="main-auth-container">
      <div className="progress-bar-container">
        <ProgressBar
          percent={calculateProgress()}
          filledBackground="linear-gradient(to right, #4CAF50, #2E7D32)"
          height="8px"
        >
          {steps.map((step) => (
            <Step key={step.id}>
              {({ accomplished }) => (
                <div className={`indexed-step ${step.isComplete ? "accomplished" : ""}`}>
                  <div className={`step-marker ${step.isComplete ? "accomplished" : ""}`}>
                    {step.isComplete ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="step-name">{step.name}</div>
                </div>
              )}
            </Step>
          ))}
        </ProgressBar>
      </div>

      <div className="auth-container" style={{ position: "relative" }}>
        {currentStep >= 3 && (
          <div
            style={{ position: "absolute", top: "20px", left: "20px", cursor: "pointer", fontSize: "22px", fontWeight: "bold" }}
            onClick={() => {
              setCurrentStep(2);
              setIsVerified(false);
              setVerificationCode("");
              setPassword("");
              setConfirmPassword("");
            }}
            title="Back"
          >
            ←
          </div>
        )}

        <h2>Sign Up</h2>
        <p>Create your account and start your journey</p>

        <form onSubmit={handleSignup}>
          {currentStep <= 2 && (
            <>
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "username")}
                  required
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsVerified(false);
                  }}
                  ref={emailRef}
                  required
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={isSending}
                  className="auth-btn"
                  style={{ marginTop: "10px" }}
                >
                  {isSending ? "Sending..." : "Send Verification Code"}
                </button>
              </div>
              <p className="auth-link">
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </>
          )}

          {currentStep >= 3 && (
            <>
              <div className="input-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  placeholder="Enter the code sent to your email"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  ref={verificationRef}
                  required
                  autoFocus={currentStep === 3}
                />
                <button
                  type="button"
                  onClick={handleVerification}
                  className="auth-btn"
                  style={{ marginTop: "10px" }}
                >
                  Verify Email
                </button>
                {isVerified && (
                  <p style={{ color: "green", marginTop: "5px" }}>
                    Email verified ✔
                  </p>
                )}
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "password")}
                    ref={passwordRef}
                    required
                    autoFocus={currentStep === 4}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "confirm")}
                    ref={confirmPasswordRef}
                    required
                    autoFocus={currentStep === 5}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn"
                disabled={!isVerified}
              >
                Sign Up
              </button>
              <p className="auth-link">
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </>
          )}
        </form>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ marginTop: "80px" }}
      />
    </div>
  );
};

export default Signup;