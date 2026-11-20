import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { SettingsProvider } from "./context/SettingsContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </SettingsProvider>
  </StrictMode>
);
