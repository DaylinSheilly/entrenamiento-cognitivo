import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, Outlet } from "react-router-dom";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";

const RequireProfileComplete = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

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
        if (!res.data.profile_complete) {
          navigate('/complete-profile');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          navigate('/complete-profile');
        }
      } finally {
        setChecking(false);
      }
    };
    checkProfile();
  }, [isAuthenticated, isLoading, getAccessTokenSilently, navigate]);

  if (isLoading || checking) return <CircularProgress />;
  return <Outlet />;
};

export default RequireProfileComplete;
