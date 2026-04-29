import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    localStorage.removeItem("currentUser");
    currentUser = null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;