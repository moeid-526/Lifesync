import React, { useState, useRef, useEffect } from "react";
import { getAuth } from "firebase/auth";
import "../styles.css";

export default function Report() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pastReports, setPastReports] = useState([]);
  const reportRef = useRef(null);
  const auth = getAuth();

  useEffect(() => {
    fetchPastReports();
  }, []);

  const fetchPastReports = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch("http://localhost:5012/past-reports", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch past reports");
      const data = await res.json();
      setPastReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError("");
    setPdfUrl(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You need to be logged in to generate a report");
      const idToken = await user.getIdToken();

      const res = await fetch("http://localhost:5012/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);

      // Refresh past reports list
      await fetchPastReports();

      setTimeout(() => {
        if (reportRef.current) {
          reportRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    } catch (err) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "LifeSync_Report.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewPastReport = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`http://localhost:5012/past-reports/${id}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    setPdfUrl(url);
    setTimeout(() => {
      if (reportRef.current) {
        reportRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 200);
  };

  const handleDeletePastReport = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();

      await fetch(`http://localhost:5012/past-reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      // Clear viewer if the currently opened report was deleted
      if (pdfUrl) {
        setPdfUrl(null);
      }

      await fetchPastReports();
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  return (
    <div>
      {/* Report Generator Section */}
      <div className="report-container">
        <h2 className="mn-head">
          Measure <span className="mn-high">Your</span> Milestones
        </h2>
        <p className="mn-sub">
          Generate and review your personalized weekly insights in one place.
        </p>

        <div className="instructions-list">
          <p>📅 Reports summarize your past week's activities and insights</p>
          <p>⚡ Click "Generate Report" and wait for the magic to happen</p>
          <p>👀 Review your report right here in the viewer</p>
          <p>⬇ Download a copy to keep or share</p>
        </div>

        <button
          className="report-button"
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>

      {/* Past Reports Section */}
      <div className="past-reports-section">
        <h3 className="mn-head">
          Your <span className="mn-high">Past</span> Reports
        </h3>
        <p className="mn-sub">
          Access and manage your previously generated reports.
        </p>
        <ul className="past-reports-list">
          {pastReports.length === 0 ? (
            <p className="no-reports-text">No past reports found.</p>
          ) : (
            pastReports.map((report) => (
              <li key={report._id} className="past-report-item">
                <div className="report-info">
                  <strong className="report-date">
                    {new Date(report.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                  <span className="report-time">
                    {new Date(report.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="report-actions">
                  <button
                    className="view-btn"
                    onClick={() => handleViewPastReport(report._id)}
                  >
                    View
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeletePastReport(report._id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>


      {/* Report Viewer Section */}
      {pdfUrl && (
        <div className="report-viewer-section" ref={reportRef}>
          <h3 className="mn-head">
            View <span className="mn-high">Your</span> Report
          </h3>
          <p className="mn-sub">View, explore, and download your report with ease.</p>

          <div className="instructions-list">
            <p>👓 View your personalized insights directly below</p>
            <p>📖 Scroll through pages using the built-in PDF controls</p>
            <p>🔍 Zoom in for details or zoom out for an overview</p>
            <p>⬇ Click "Download PDF" to save it for later</p>
          </div>

          <iframe src={pdfUrl} title="LifeSync Report" className="report-viewer" />
          <button className="download-button" onClick={handleDownload}>
            ⬇ Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
