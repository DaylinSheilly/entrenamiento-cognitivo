import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";

const RequireProfileComplete = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [checking, setChecking] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!isAuthenticated || isLoading) return;
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://api.neurosite.com"
          }
        });
        const res = await axios.get('http://localhost:5000/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsProfileComplete(!!res.data.profile_complete);
      } catch (error) {
        if (error.response?.status === 404) {
          setIsProfileComplete(false);
        }
      } finally {
        setChecking(false);
      }
    };
    checkProfile();
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  if (isLoading || checking) return <CircularProgress />;
  
  return isProfileComplete ? <Outlet /> : <Navigate to="/complete-profile" replace />;
};

export default RequireProfileComplete;
