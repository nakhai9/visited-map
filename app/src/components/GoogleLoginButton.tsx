import GoogleIcon from "@mui/icons-material/Google";
import { Button } from "@mui/material";
import { useState } from "react";
import { SYSTEM_APIS } from "./../shared/configs/api";
import { signInWithGooglePopup } from "./../shared/configs/firebaseConfig";

export default function GoogleLoginButton() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const logGoogleUser = async () => {
    setIsSigningIn(true);
    try {
      const response = await signInWithGooglePopup();
      const idToken = await response.user.getIdToken();
      console.log(response);
      console.log(idToken);
      await sendIdTokenToServer(idToken);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const sendIdTokenToServer = async (idToken: string) => {
    try {
      const response = await fetch(`${SYSTEM_APIS.authGoogle}`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ idToken: idToken }),
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button
      onClick={logGoogleUser}
      disabled={isSigningIn}
      fullWidth
      variant="outlined"
      startIcon={<GoogleIcon />}
    >
      Google
    </Button>
  );
}
