// packages/frontend/src/App.tsx

import { HashRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AuditPage } from "./pages/AuditPage";
import { Settings } from "./pages/Settings";
// 1. Import the new ChatPage component
import { ChatPage } from "./pages/ChatPage";
import "./App.css";
import { MemoryPage } from "./pages/MemoryPage";
import { UpdatePage } from "./pages/UpdatePage";

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AuditPage />} />
            <Route path="/settings" element={<Settings />} />

            {/* 2. Add the new route for the chat page */}
            <Route path="/chat" element={<ChatPage />} />

            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/updates" element={<UpdatePage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
