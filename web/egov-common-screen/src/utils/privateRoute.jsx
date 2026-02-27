import { Navigate } from "react-router-dom";
import { storage } from "./localstorage"; 

const PrivateRoute = ({ children }) => {
  const user = storage.get("user-info"); 
  if (!user) {
    return <Navigate to="/propertyQRData" replace />;   
  }

  return children;
};

export default PrivateRoute;