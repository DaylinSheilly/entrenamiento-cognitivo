import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@mui/material";

const SignUpButton = () => {
    const { loginWithRedirect } = useAuth0();

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={() => loginWithRedirect({
                authorizationParams: {
                    scope: "openid profile email"
                },
                screen_hint: 'signup',
                appState: {
                    returnTo: window.location.origin + "/complete-profile"
                }
            })}
        >
            Registrarse
        </Button>
    );
};

export default SignUpButton;
