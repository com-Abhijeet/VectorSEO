import React from "react";
import { NavLink } from "react-router-dom";
// 1. Import a new icon for the chat page
import {
  Search,
  Settings as SettingsIcon,
  BrainCircuit,
  BookUser,
} from "lucide-react";

export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar__header">
        <h1>VectorSEO</h1>
        <p>AI-Powered Audit Tool</p>
      </div>
      <ul className="sidebar__nav">
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
      </ul>
    </nav>
  );
}
