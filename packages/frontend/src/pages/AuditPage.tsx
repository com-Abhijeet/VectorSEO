import {
  LinkIcon,
  FileStack,
  Mail,
  LoaderCircle,
  Rocket,
  FileText,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const AuditPage = () => {
  // State for form inputs
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(10);
  const [sendEmail, setSendEmail] = useState(false);

  // State for application status
  const [isAuditing, setIsAuditing] = useState(false);
  const [log, setLog] = useState(
    "Welcome to VectorSEO. Enter a URL to begin..."
  );
  const [progress, setProgress] = useState(0);
  const [resultPath, setResultPath] = useState("");

  const logRef = useRef<HTMLDivElement>(null);

  // Effect to scroll the log to the bottom when it updates
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // Effect to set up and tear down backend event listeners
  useEffect(() => {
    const appendToLog = (message: string) => {
      setLog((prevLog) => prevLog + "\n" + message);
    };

    window.electronAPI.onAuditProgress((update) => {
      appendToLog(update.message);
      setProgress(update.percent);
    });

    window.electronAPI.onAuditComplete((result) => {
      setProgress(100);
      appendToLog(`\n🎉 Success! Report is ready.`);
      if (result.emailSentTo) {
        appendToLog(`📧 Report sent to: ${result.emailSentTo}`);
      } else if (result.emailError) {
        appendToLog(`⚠️ Email Error: ${result.emailError}`);
      }
      setResultPath(result.pdfPath);
      setIsAuditing(false);
    });

    window.electronAPI.onAuditError((error) => {
      appendToLog(`\n❌ Error: ${error}`);
      setIsAuditing(false);
      setProgress(0);
    });

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      window.electronAPI.removeAllListeners();
    };
  }, []); // Empty array ensures this effect runs only once

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Reset state for a new audit
    setLog(`🚀 Starting audit for: ${url}`);
    setProgress(5);
    setResultPath("");
    setIsAuditing(true);

    window.electronAPI.runAudit({
      url,
      limit,
      provider: "ollama", // Hardcoded as in the original script
      send: sendEmail,
    });
  };

  const handleOpenPdf = () => {
    if (resultPath) {
      window.electronAPI.openPdf(resultPath);
    }
  };

  return (
    <div className="app-layout">
      <div className="controls-panel">
        <form id="audit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url-input">
              <LinkIcon size={16} /> Target URL
            </label>
            <input
              type="url"
              id="url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="limit-input">
              <FileStack size={16} /> Crawl Limit (Pages)
            </label>
            <input
              type="number"
              id="limit-input"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              min="1"
              max="100"
            />
          </div>
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="send-email-checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              <label htmlFor="send-email-checkbox" style={{ marginBottom: 0 }}>
                <Mail size={16} /> Auto-send Email to Contact
              </label>
            </div>
          </div>
        </form>

        <button
          type="submit"
          id="submit-btn"
          form="audit-form"
          disabled={isAuditing}
        >
          {isAuditing ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Rocket size={16} />
          )}
          {isAuditing ? "Auditing..." : "Start Audit"}
        </button>
      </div>

      <div className="terminal-panel">
        {isAuditing && (
          <div id="progress-bar-container">
            <div id="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        <div id="status-log" ref={logRef}>
          {log}
        </div>
        {resultPath && (
          <div id="result-area">
            <h3>Audit Complete!</h3>
            <p id="result-path" style={{ marginBottom: "15px" }}>
              Report saved to: {resultPath}
            </p>
            <button id="open-pdf-btn" onClick={handleOpenPdf}>
              <FileText size={16} /> Open PDF Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPage;
