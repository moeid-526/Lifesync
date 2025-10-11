import { useEffect, useRef } from 'react';
import axios from 'axios';

export const useActiveTimeTracker = (userId) => {
  const activeSeconds = useRef(0);
  const lastUpdateTime = useRef(Date.now());
  const isActive = useRef(true);
  const todayKey = new Date().toISOString().split('T')[0];

  // Send data to backend
  const sendActiveTime = async (seconds) => {
    try {
      await axios.post('http://localhost:5004/active-time', {
        userId,
        seconds
      });
      activeSeconds.current = 0; // Reset after successful send
    } catch (error) {
      console.error('Failed to send active time:', error);
    }
  };

  // Track activity
  useEffect(() => {
    if (!userId) return;

    // Track visibility changes
    const handleVisibilityChange = () => {
      isActive.current = !document.hidden;
      if (isActive.current) {
        lastUpdateTime.current = Date.now(); // Reset timer when becoming active
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Main interval for tracking time
    const interval = setInterval(() => {
      if (isActive.current) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateTime.current) / 1000);
        activeSeconds.current += elapsedSeconds;
        lastUpdateTime.current = now;

        // Send update every minute (or adjust as needed)
        if (activeSeconds.current >= 60) {
          sendActiveTime(activeSeconds.current);
        }
      }
    }, 5000); // Check every 5 seconds

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      
      // Send remaining time when unmounting
      if (activeSeconds.current > 0) {
        sendActiveTime(activeSeconds.current);
      }
    };
  }, [userId]);

  // Send remaining time when day changes
  useEffect(() => {
    const checkDayChange = setInterval(() => {
      const newTodayKey = new Date().toISOString().split('T')[0];
      if (newTodayKey !== todayKey && activeSeconds.current > 0) {
        sendActiveTime(activeSeconds.current);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkDayChange);
  }, [todayKey, userId]);
};