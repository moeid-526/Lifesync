import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

// 1. Create context (not exported)
const TimeTrackerContext = createContext();

// 2. Create provider component (default export)
export default function TimeTrackerProvider({ children }) {
  const [activeTime, setActiveTime] = useState(0);
  const [userId, setUserId] = useState("");
  const [dailyActiveTime, setDailyActiveTime] = useState({});

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    let activeTimer = 0;
    let timerInterval;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timerInterval);
      } else {
        timerInterval = setInterval(() => {
          activeTimer += 1;
          setActiveTime(activeTimer);
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    const updateActiveTime = async () => {
      if (userId && activeTime > 0) {
        const today = getTodayDate();
        const activeTimeInMinutes = Math.floor(activeTime / 60);

        setDailyActiveTime(prevState => ({
          ...prevState,
          [today]: (prevState[today] || 0) + activeTimeInMinutes,
        }));

        try {
          await fetch("http://localhost:5004/active-time", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              minutes: activeTimeInMinutes
            }),
          });
        } catch (error) {
          console.error("Error sending data to backend:", error);
        }
      }
    };

    const sendActiveTime = setInterval(updateActiveTime, 60000);
    return () => clearInterval(sendActiveTime);
  }, [userId, activeTime]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    activeTime,
    setUserId,
    dailyActiveTime
  }), [activeTime, dailyActiveTime]);

  return (
    <TimeTrackerContext.Provider value={contextValue}>
      {children}
    </TimeTrackerContext.Provider>
  );
}

// 3. Export hook separately (named export)
export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (context === undefined) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
}