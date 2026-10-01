import GoogleIcon from "@mui/icons-material/Google";
import { type ButtonProps } from "@mui/material";
import BaseButton from "./../shared/components/BaseButton";
import { useGoogleLogin } from "./../shared/hooks/useGoogleLogin";

export default function GoogleLoginButton(props: ButtonProps) {
  const { login } = useGoogleLogin();

  return (
    <BaseButton
      variant="outlined"
      startIcon={<GoogleIcon />}
      {...props}
      onClick={login}
    >
      Đăng nhập
    </BaseButton>
  );
}
