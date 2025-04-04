import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, isAuthenticated }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
