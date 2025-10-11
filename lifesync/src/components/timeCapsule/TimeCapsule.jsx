import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTimes, FaDownload } from "react-icons/fa";
import "../styles.css";

const TimeCapsule = () => {
  const [file, setFile] = useState(null);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadDisabled, setUploadDisabled] = useState(true);
  const [description, setDescription] = useState("");
  const [unlockDateTime, setUnlockDateTime] = useState("");
  const [useSteganography, setUseSteganography] = useState(false);
  const [hiddenMessage, setHiddenMessage] = useState("");
  const [capsules, setCapsules] = useState([]);
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewedCapsule, setViewedCapsule] = useState(null);

  const viewedCapsuleRef = useRef(null);
  const fileInputRef = useRef(null); // Added for form reset

  // Supported file formats
  const supportedFormats = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    // Documents
    'application/pdf', 'text/plain',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchCapsules = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:5009/api/time-capsule/user-capsules`,
        { params: { userId } }
      );
      if (data.success) {
        setCapsules(data.data);
      }
    } catch (err) {
      console.error("Error fetching capsules:", err);
    }
  };

  useEffect(() => {
    if (userId) fetchCapsules();
  }, [userId]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!supportedFormats.includes(selectedFile.type)) {
      toast.error('Unsupported file format');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Detect type
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (isImage || isVideo) {
      setFile(selectedFile);
      setIsScanning(true);

      toast.info(`🔍 Vision Guard is scanning your ${isImage ? 'image' : 'video'}...`);

      try {
        const { data } = await axios.post('http://localhost:5010/scan', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setIsNsfw(data.is_nsfw);
        setUploadDisabled(data.is_nsfw);

        toast[data.is_nsfw ? 'error' : 'success'](
          data.is_nsfw
            ? '🚫 Blocked (NSFW Content)'
            : `✅ Safe ${isImage ? '(Image)' : '(Video)'} Scan Successful`
        );
      } catch (err) {
        toast.error(`⚠️ ${isImage ? 'Image' : 'Video'} scan failed.`);
        console.error('Scan error:', err);
      } finally {
        setIsScanning(false);
      }
    } else {
      // For other file types (PDF, audio, text), skip scanning
      setFile(selectedFile);
      setUploadDisabled(false);
    }
  };


  const handleSubmit = async () => {
    if (!file || !description || !unlockDateTime || !userId || isSubmitting) {
      if (!file) toast.error("Please select a file");
      if (!description.trim()) toast.error("Please add a description");
      if (!unlockDateTime) toast.error("Please set an unlock date/time");
      return;
    }

    if (useSteganography && !hiddenMessage.trim()) {
      toast.error("Please enter a hidden message for steganography");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating time capsule...");

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("file", file);
      formData.append("description", description.trim());
      formData.append("unlockDateTime", unlockDateTime);
      formData.append("useSteganography", useSteganography);

      if (useSteganography) {
        formData.append("hiddenMessage", hiddenMessage);
      }

      const { data } = await axios.post(
        "http://localhost:5009/api/time-capsule/create-capsule",
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (data.success) {
        toast.update(toastId, {
          render: "Time Capsule created successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
        await fetchCapsules();
        resetForm();
      } else {
        throw new Error(data.message || "Failed to create capsule");
      }
    } catch (err) {
      toast.update(toastId, {
        render: `Failed: ${err.response?.data?.message || err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      console.error("Creation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDescription("");
    setUnlockDateTime("");
    setUseSteganography(false);
    setHiddenMessage("");
    setIsNsfw(false);
    setUploadDisabled(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async () => {
    if (!viewedCapsule) return;

    try {
      const response = await axios.get(
        `http://localhost:5009/api/time-capsule/capsule-file?filename=${viewedCapsule.filename}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', viewedCapsule.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
      console.error('Download error:', error);
    }
  };

  const handleViewCapsule = (capsule) => {
    if (isUnlocked(capsule.unlockDate)) {
      setViewedCapsule(capsule);
      setTimeout(() => {
        viewedCapsuleRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const closeViewedCapsule = () => {
    setViewedCapsule(null);
  };

  const isUnlocked = (unlockDateTime) => {
    return new Date() >= new Date(unlockDateTime);
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="timecapsule-header">
        <h3 className="mn-head">
          Preserve <span className="mn-high">Life's </span>Moments
        </h3>
        <p className="mn-sub">A reflection space to securely store memories for the future.</p>
        <div className="instructions-list">
          <p>📦 Upload texts, images, videos, or PDFs.</p>
          <p>⏰ Set a future unlock date and time</p>
          <p>🕵️‍♂️ Optional steganography for extra secrecy</p>
          <p>📅 View and unlock your capsules below</p>
        </div>
      </div>

      <div className="timecapsule-container">
        <div className="upload-section">
          <h3 className="mn-head">Create <span className="mn-high">New</span> Capsule</h3>
          <p className="mn-sub">
            Preserve your memories by uploading photos, videos, and notes into your personal time capsule.
          </p>

          <div className="upload-area">
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.mp4,.webm,.ogg,.mov,.avi,.pdf,.txt,.mp3,.wav"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            {isScanning && <p>Scanning for NSFW content...</p>}
            {isNsfw && <p className="error-text">NSFW content blocked!</p>}
          </div>

          <textarea
            className="timecapsule-textarea"
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="datetime-picker">
            <label>Unlock Date & Time:</label>
            <input
              type="datetime-local"
              value={unlockDateTime}
              onChange={(e) => setUnlockDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              disabled={isSubmitting}
            />
          </div>

          <div className="steganography-toggle">
            <label>
              <input
                type="checkbox"
                checked={useSteganography}
                onChange={() => setUseSteganography(!useSteganography)}
              />
              Enable Steganography (Hide secret message in image)
            </label>
          </div>

          {useSteganography && (
            <div className="steganography-message">
              <label>Hidden Message:</label>
              <textarea
                className="timecapsule-textarea"
                placeholder="Enter your secret message..."
                value={hiddenMessage}
                onChange={(e) => setHiddenMessage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <button
            className="timecapsule-button"
            onClick={handleSubmit}
            disabled={!file || !description.trim() || !unlockDateTime || uploadDisabled || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "🚀 Create Time Capsule"}
          </button>
        </div>

        <div className="capsules-column">
          <h3 className="mn-head">Your <span className="mn-high">Time</span> Capsules</h3>
          <p className="mn-sub">
            Explore your created capsules, check their unlock dates, and open them when the time is right.
          </p>

          <div className="capsules-list-container">
            {capsules.length === 0 ? (
              <p className="no-capsules">No capsules yet. Create one above!</p>
            ) : (
              <div className="capsules-list">
                {capsules.map((capsule) => {
                  const unlocked = isUnlocked(capsule.unlockDate);
                  return (
                    <div key={capsule._id} className={`capsule-row ${unlocked ? 'unlocked' : 'locked'}`}>
                      <div className="capsule-summary">
                        <div className="capsule-meta">
                          <span className="capsule-date">
                            Unlocks: {formatDateTime(capsule.unlockDate)}
                          </span>
                          <span className="capsule-created">
                            Created: {formatDateTime(capsule.createdAt)}
                          </span>
                        </div>
                        <button
                          className={`view-button ${unlocked ? '' : 'disabled'}`}
                          onClick={() => handleViewCapsule(capsule)}
                          disabled={!unlocked}
                        >
                          {unlocked ? '🔓 View' : '⏳ Locked'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div ref={viewedCapsuleRef}>
          {viewedCapsule && (
            <div className="viewed-capsule-section">
              <div className="viewed-capsule-header">
                <h3>Time Capsule Contents</h3>
                <button className="close-button" onClick={closeViewedCapsule}>
                  <FaTimes />
                </button>
              </div>

              <div className="viewed-capsule-content">
                <div className="capsule-meta-info">
                  <p><strong>Created:</strong> {formatDateTime(viewedCapsule.createdAt)}</p>
                  <p><strong>Unlocked:</strong> {formatDateTime(viewedCapsule.unlockDate)}</p>
                </div>

                <div className="capsule-description">
                  <h4>Description</h4>
                  <p>{viewedCapsule.description}</p>
                </div>

                {viewedCapsule.fileType && (
                  <div className="capsule-media-container">
                    <h4>Media Content</h4>
                    <div className="media-content">
                      {viewedCapsule.fileType.startsWith('image/') ? (
                        <img
                          src={`http://localhost:5009/api/time-capsule/capsule-file?filename=${viewedCapsule.filename}`}
                          alt="Capsule content"
                          className="capsule-media"
                        />
                      ) : viewedCapsule.fileType.startsWith('video/') ? (
                        <video controls className="capsule-media">
                          <source
                            src={`http://localhost:5009/api/time-capsule/capsule-file?filename=${viewedCapsule.filename}`}
                            type={viewedCapsule.fileType}
                          />
                          Your browser does not support the video tag.
                        </video>
                      ) : viewedCapsule.fileType.startsWith('audio/') ? (
                        <audio controls className="capsule-media">
                          <source
                            src={`http://localhost:5009/api/time-capsule/capsule-file?filename=${viewedCapsule.filename}`}
                            type={viewedCapsule.fileType}
                          />
                          Your browser does not support the audio element.
                        </audio>
                      ) : (
                        <div className="file-download">
                          <a
                            href={`http://localhost:5009/api/time-capsule/capsule-file?filename=${viewedCapsule.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-link"
                          >
                            Download {viewedCapsule.fileType.split('/')[1] || 'file'}
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleDownload}
                      className="download-button"
                    >
                      <FaDownload /> Download Content
                    </button>
                  </div>
                )}

                {viewedCapsule.useSteganography && (
                  <div className="hidden-message">
                    <h4>Hidden Message</h4>
                    <div className="message-content">
                      <p>{viewedCapsule.hiddenMessage || "Message revealed through steganography"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeCapsule;