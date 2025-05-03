import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@mui/material";

const LogoutButton = () => {
  const { logout } = useAuth0();
  return (
    <Button
      color="primary"
      variant="outlined"
      onClick={() =>
        logout({
          logoutParams: {
            returnTo: window.location.origin + "/home"
          }
        })
      }
    >
      Cerrar sesión
    </Button>
  );
};

export default LogoutButton;
