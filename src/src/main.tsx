import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { initSfx } from "./services/sfx";
import ErrorBoundary from "./components/ErrorBoundary";
import { GlobalErrorOverlay } from "./components/GlobalErrorOverlay";

initSfx();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorOverlay>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GlobalErrorOverlay>
  </React.StrictMode>
);
