import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import LogService from "../Services/LogService"; // 🔹 Add this after other imports
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {

  useEffect(() => {
    const shouldShowToast = sessionStorage.getItem('showDeleteToast');
    if (shouldShowToast) {
      toast.success('Account deleted successfully');
      sessionStorage.removeItem('showDeleteToast'); // clear it after showing
    }
  }, []);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Automatically redirect if already logged in and session is valid

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    const lastLoginTime = localStorage.getItem("lastLoginTime");
    const now = Date.now();

    if (user && lastLoginTime && now - parseInt(lastLoginTime) < 24 * 60 * 60 * 1000) {
      const autoLoginLogged = localStorage.getItem("autoLoginLogged");
      if (!autoLoginLogged) {
        const idToken = await user.getIdToken();
        const formattedTime = new Date().toLocaleString("en-GB");
        const message = `Action: You Logged In To Lifesync\n\nTime: ${formattedTime}`;

        // ✅ Use LogService here
        await LogService.sendLog(message, idToken);

        localStorage.setItem("autoLoginLogged", "true");
      }

      navigate("/dashboard");
    }
  });

  return () => unsubscribe();
}, []);



  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Set auth persistence
      await setPersistence(auth, browserLocalPersistence);

      // Then proceed with login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      await LogService.sendLog(null, idToken, "User Logged In");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const username = userDoc.data().username;
        toast.success(`Welcome back, ${username}! Redirecting...`);
      } else {
        toast.success("Login successful! Redirecting...");
      }

      localStorage.setItem("lastLoginTime", Date.now().toString());

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error(error.message);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
      setTimeout(() => {
        setShowForgotPassword(false);
        setEmail("");
      }, 2000);
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        toast.error("Invalid email format.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else {
        toast.error("Error sending password reset email.");
      }
      console.error(error);
    }
  };

  return (
    <div className="main-auth-container">
      <div className="auth-container login-container">
        <h2>{showForgotPassword ? "Reset Password" : "Login"}</h2>
        <p>
          {showForgotPassword
            ? "Enter your email to receive a password reset link."
            : "Welcome back! Please login to your account."}
        </p>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            <button type="submit" className="auth-btn">Login</button>
          </form>
        ) : (
          <div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              onClick={handlePasswordReset}
              className="auth-btn"
            >
              Reset Password
            </button>
          </div>
        )}

        {!showForgotPassword && (
          <p className="auth-link">
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
              }}
            >
              Forgot Password?
            </Link>
          </p>
        )}

        {!showForgotPassword ? (
          <p className="auth-link">
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>
        ) : (
          <p className="auth-link">
            Remember your password?{" "}
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(false);
              }}
            >
              Back to login
            </Link>
          </p>
        )}
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

export default Login;
