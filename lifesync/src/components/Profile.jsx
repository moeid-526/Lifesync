import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LinearProgress from '@mui/material/LinearProgress';
import "./styles.css";

const API_BASE_URL = 'http://localhost:5006';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [profileProgress, setProfileProgress] = useState(30);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error('Please login to view profile');
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Fetch profile picture from MongoDB
          let profilePicture = '';
          try {
            const response = await fetch(`${API_BASE_URL}/api/profile-picture?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
              const result = await response.json();
              profilePicture = result.profilePicture || '';
            }
          } catch (error) {
            console.error('Error fetching profile picture:', error);
          }

          setUserData({
            ...data,
            email: user.email,
            profilePicture,
            lastLogin: new Date(user.metadata.lastSignInTime).toLocaleString(),
            accountCreated: new Date(user.metadata.creationTime).toLocaleString()
          });
          setEditedUsername(data.username || '');

          // Calculate profile completeness
          let progress = 30; // Base value
          if (profilePicture) progress += 40;
          if (data.username) progress += 30;
          setProfileProgress(progress);
        } else {
          toast.error('User data not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEditProfile = () => {
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to update profile');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        username: editedUsername
      });

      setUserData(prev => ({
        ...prev,
        username: editedUsername
      }));

      // Update progress
      let newProgress = 60; // email + username
      if (userData?.profilePicture) newProgress += 40;
      setProfileProgress(newProgress);

      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditedUsername(userData?.username || '');
    setEditMode(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to upload profile picture');
        return;
      }

      // Convert image to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Image = reader.result;

          const response = await fetch(`${API_BASE_URL}/api/upload-profile-picture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              profilePicture: base64Image
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save profile picture');
          }

          // Update local state
          setUserData(prev => ({
            ...prev,
            profilePicture: base64Image
          }));

          setProfileProgress(100);
          toast.success('Profile picture updated successfully!');
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(error.message || 'Failed to upload profile picture');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = (error) => {
        setUploading(false);
        toast.error('Error reading file');
        console.error('FileReader error:', error);
      };

    } catch (error) {
      setUploading(false);
      console.error('Error in handleFileChange:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to delete profile picture');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/delete-profile-picture`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile picture');
      }

      // Update local state
      setUserData(prev => ({
        ...prev,
        profilePicture: ''
      }));

      // In handleDeleteProfilePicture function, after setUserData
      window.dispatchEvent(new CustomEvent('profilePictureChanged', {
        detail: { profilePicture: '' }
      }));

      // Update progress
      setProfileProgress(60); // Just email + username

      toast.success('Profile picture removed successfully!');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      toast.error(error.message || 'Failed to delete profile picture');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
  
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to delete account');
        return;
      }
  
      // Delete profile picture from MongoDB (if exists)
      try {
        const response = await fetch(`${API_BASE_URL}/api/delete-profile-picture`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });
  
        if (response.status === 404) {
          console.log('No profile picture to delete — using default avatar.');
        } else if (!response.ok) {
          console.warn('Failed to delete profile picture');
        }
      } catch (mongoError) {
        console.error('Error deleting profile picture:', mongoError);
      }
  
      // Delete Firestore user document
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (firestoreError) {
        console.error('Error deleting Firestore document:', firestoreError);
      }
  
      // Delete from Firebase Auth
      try {
        await deleteUser(user);
      } catch (firebaseError) {
        console.error('Error deleting Firebase Auth user:', firebaseError);
        toast.error('Failed to delete Firebase user');
        return;
      }
  
      // Show success toast and navigate after it completes
      toast.success('Account deleted successfully', {
        onClose: () => {
          navigate('/login');
        },
        autoClose: 3000 // 3 seconds
      });
  
    } catch (error) {
      console.error('Unexpected error deleting account:', error);
      toast.error('Unexpected error occurred while deleting account');
    }
  };
  const triggerFileInput = () => {
    if (editMode) {
      fileInputRef.current.click();
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading profile...</div>;
  }

  return (
    <motion.div
      className="profile-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Profile Header */}
      <motion.section
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mn-head">
          View <span className="mn-high">Your</span> Profile
        </h2>

        <p className="mn-sub">Manage your account details and preferences</p>
      </motion.section>

      {/* Profile Completeness */}
      <motion.div
        className="profile-progress"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="progress-header">
          <h3>Profile Completeness</h3>
          <span>{profileProgress}%</span>
        </div>
        <LinearProgress
          variant="determinate"
          value={profileProgress}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundColor: profileProgress === 100 ? '#1abc9c' : '#a90707'
            }
          }}
        />
        <p className="progress-tip">
          {profileProgress === 100
            ? 'Great job! Your profile is complete.'
            : 'Add a profile picture and username to complete your profile.'}
        </p>
      </motion.div>

      {/* User Info Section */}
      <motion.section
        className="profile-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="profile-avatar">
          <div
            className="avatar-container"
            onClick={triggerFileInput}
            style={{ cursor: editMode ? 'pointer' : 'default' }}
          >
            {userData?.profilePicture ? (
              <img
                src={userData.profilePicture}
                alt="Profile"
                className="avatar-image"
              />
            ) : (
              <div className="avatar-circle">
                {userData?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {editMode && (
              <div className="avatar-overlay">
                <span className="upload-icon">+</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {editMode ? (
            <div className="username-edit">
              <input
                type="text"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="username-input"
                placeholder="Enter username"
              />
            </div>
          ) : (
            <h2>{userData?.username || 'User'}</h2>
          )}
          <p className="user-email">{userData?.email}</p>

          {uploading && <p className="upload-status">Uploading profile picture...</p>}

          {/* Add delete profile picture button in edit mode */}
          {editMode && userData?.profilePicture && (
            <motion.button
              className="delete-pic-btn"
              onClick={handleDeleteProfilePicture}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Remove Profile Picture
            </motion.button>
          )}
        </div>

        <div className="profile-details">
          <motion.div
            className="detail-card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <h3>Account Information</h3>
            <div className="detail-item">
              <span>Username:</span>
              {editMode ? (
                <span className="editable-field">
                  <input
                    type="text"
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    className="edit-input"
                  />
                </span>
              ) : (
                <span>{userData?.username || 'Not set'}</span>
              )}
            </div>
            <div className="detail-item">
              <span>Email:</span>
              <span>{userData?.email}</span>
            </div>
            <div className="detail-item">
              <span>User ID:</span>
              <span className="user-id">{auth.currentUser?.uid}</span>
            </div>
          </motion.div>

          <motion.div
            className="detail-card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <h3>Activity</h3>
            <div className="detail-item">
              <span>Last Login:</span>
              <span>{userData?.lastLogin}</span>
            </div>
            <div className="detail-item">
              <span>Account Created:</span>
              <span>{userData?.accountCreated}</span>
            </div>
            <div className="detail-item">
              <span>Status:</span>
              <span className="status-active">Active</span>
            </div>
          </motion.div>


        </div>
      </motion.section>

      {/* Account Actions Section */}
      <motion.section
        className="actions-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2>Account Actions</h2>
        <div className="action-buttons">
          {editMode ? (
            <>
              <motion.button
                className="save-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveProfile}
              >
                Save Changes
              </motion.button>
              <motion.button
                className="cancel-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancelEdit}
              >
                Cancel
              </motion.button>
            </>
          ) : (
            <motion.button
              className="edit-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditProfile}
            >
              Edit Profile
            </motion.button>
          )}


          <motion.button
            className="logout-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              auth.signOut()
                .then(() => {
                  // Clear session tracking from localStorage
                  localStorage.removeItem("lastActivity");
                  localStorage.removeItem("lastLoginTime");
                  navigate('/login');
                })
                .catch((error) => {
                  console.error("Logout error:", error);
                  toast.error("Failed to logout");
                });
            }}
          >
            Log Out
          </motion.button>
          <motion.button
            className="delete-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </motion.button>
        </div>
      </motion.section>

      <ToastContainer position="top-center" autoClose={3000} />
    </motion.div>
  );
};

export default Profile;