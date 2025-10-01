import React from "react";
import { NavLink } from "react-router-dom";
// 1. Import a new icon for the chat page
import {
  Search,
  Settings as SettingsIcon,
  BrainCircuit,
  BookUser,
  ArrowDownToLine,
  Github,
} from "lucide-react";

export function Sidebar() {
  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    window.electronAPI.openExternalLink(url);
  };
  return (
    <nav className="sidebar">
      <ul className="sidebar__nav">
        <li>
          <div className="sidebar__header">
            <h1>VectorSEO</h1>
            <p>AI-Powered Audit Tool</p>
          </div>
        </li>
        <li>
          <NavLink to="/" className="sidebar__nav-link" end>
            <Search size={18} />
            <span>Audit</span>
          </NavLink>
        </li>
        {/* 2. Add the new link to the navigation */}
        <li>
          <NavLink to="/chat" className="sidebar__nav-link">
            <BrainCircuit size={18} />
            <span>SEO Brain</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className="sidebar__nav-link">
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/memory" className="sidebar__nav-link">
            <BookUser size={18} />
            <span>AI Memory</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/updates" className="sidebar__nav-link">
            <ArrowDownToLine size={18} />
            <span>Updates</span>
          </NavLink>
        </li>
      </ul>
      <footer className="sidebar__footer">
        <p>Developed by Abhijeet Shinde</p>
        <a
          href="https://github.com/com-Abhijeet/VectorSEO"
          onClick={(e) =>
            handleLinkClick(e, "https://github.com/com-Abhijeet/VectorSEO")
          }
          className="sidebar__footer-link"
        >
          <Github size={16} />
          View on GitHub
        </a>
      </footer>
    </nav>
  );
}
