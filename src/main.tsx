import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- Source protection ---
if (typeof window !== "undefined") {
  // Disable right-click context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Block common dev-tools / view-source shortcuts
  document.addEventListener("keydown", (e) => {
    // F12
    if (e.key === "F12") { e.preventDefault(); return; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === "U") { e.preventDefault(); return; }
    // Ctrl+S (Save page)
    if (e.ctrlKey && e.key.toUpperCase() === "S") { e.preventDefault(); return; }
  });

  // Disable text selection globally (optional layer)
  document.addEventListener("selectstart", (e) => {
    const target = e.target as HTMLElement;
    // Allow selection inside inputs/textareas
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
    e.preventDefault();
  });

  // Disable drag
  document.addEventListener("dragstart", (e) => e.preventDefault());
}

createRoot(document.getElementById("root")!).render(<App />);
