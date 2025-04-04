import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        
        // Create a new session - this should work even without authentication
        const sessionResponse = await api.createSession();
        setSessionId(sessionResponse.session_id);

        // Fetch categories
        const categoriesResponse = await api.fetchCategories();
        setCategories(categoriesResponse.categories || []);

        // Fetch languages
        const languagesResponse = await api.fetchLanguages();
        setLanguages(languagesResponse.languages || {});

        setLoading(false);
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize application. Please refresh the page.");
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Reinitialize session when user logs in or out
  useEffect(() => {
    if (currentUser) {
      // User logged in, get a new session
      const refreshSession = async () => {
        try {
          const sessionResponse = await api.createSession();
          setSessionId(sessionResponse.session_id);
        } catch (error) {
          console.error("Error refreshing session:", error);
        }
      };
      
      refreshSession();
    }
  }, [currentUser]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        categories,
        languages,
        loading,
        error,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);

export default SessionContext;
