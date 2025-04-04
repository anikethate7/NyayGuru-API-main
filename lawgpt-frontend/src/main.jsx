import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/App.css"; // Ensure this path is correct
import "./styles/Theme.css"; // Import the new Theme.css
import "./index.css"; // Make sure index.css is imported last to override other styles
import { GoogleOAuthProvider } from '@react-oauth/google';

// For development/testing, we'll use the actual CLIENT_ID from .env
// You can also hardcode it here temporarily for testing
const GOOGLE_CLIENT_ID = "462066964443-ef51htt7kml29vb5b9sp0rh9utd5fb1s.apps.googleusercontent.com";

console.log("Google Client ID being used:", GOOGLE_CLIENT_ID);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
