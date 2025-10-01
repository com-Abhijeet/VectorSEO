// packages/frontend/src/pages/UpdatePage.tsx
import React, { useState, useEffect, useRef } from "react";
import { ArrowDownToLine, CheckCircle, RefreshCw } from "lucide-react";

export const UpdatePage = () => {
  const [appVersion, setAppVersion] = useState("");
  const [status, setStatus] = useState<string>("Initializing...");
  const [progress, setProgress] = useState<number | null>(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 1. Add a ref to hold the timeout ID
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setAppVersion);

    window.electronAPI.onUpdaterStatus((update) => {
      // 2. When a response is received, clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsChecking(false);
      switch (update.event) {
        case "checking":
          setStatus("Checking for updates...");
          setIsChecking(true);
          break;
        case "available":
          setStatus(
            `Update v${update.data.version} is available. Downloading...`
          );
          break;
        case "not-available":
          setStatus("No update found. You are on the latest version.");
          break;
        case "downloading":
          setStatus("Downloading update...");
          setProgress(update.data.percent);
          break;
        case "ready":
          setStatus(`Update v${update.data.version} is ready to install.`);
          setIsUpdateReady(true);
          setProgress(null);
          break;
        case "error":
          setStatus(`Update error: ${update.data.message || "Unknown error"}`);
          break;
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.electronAPI.removeUpdaterListeners();
    };
  }, []);

  // 3. Update the handler to start and manage the timeout
  const handleCheckForUpdates = () => {
    setIsChecking(true);
    setStatus("Checking for updates...");
    window.electronAPI.checkUpdates();

    // Clear any previous timeout before starting a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a 3-second timeout
    timeoutRef.current = window.setTimeout(() => {
      setIsChecking(false);
      setStatus(
        "Update check timed out. Please check your network connection."
      );
    }, 3000);
  };

  return (
    <div className="update-page">
      <header className="update-page__header">
        <ArrowDownToLine size={28} />
        <h1>Application Updates</h1>
      </header>
      <div className="update-card">
        <div className="update-card__version">
          Current Version: <strong>{appVersion}</strong>
        </div>
        <div className="update-card__status">
          <p>{status}</p>
          {progress !== null && (
            <div className="progress-bar">
              <div
                className="progress-bar__inner"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
        <div className="update-card__actions">
          {isUpdateReady ? (
            <button
              className="button button--primary"
              onClick={() => window.electronAPI.installUpdate()}
            >
              <CheckCircle size={16} />
              Restart and Install Update
            </button>
          ) : (
            <button
              className="button"
              onClick={handleCheckForUpdates}
              disabled={isChecking}
            >
              <RefreshCw
                size={16}
                className={isChecking ? "animate-spin" : ""}
              />
              {isChecking ? "Checking..." : "Check for Updates"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
