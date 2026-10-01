import { useLoading } from "../components/BaseLoading/loading";
import { useModal } from "../components/BaseModal/modal";
import { loginWithGoogle } from "../services/authService";
import { useAuth } from "./useAuth";

export function useGoogleLogin() {
  const setUser = useAuth((state) => state.setUser);
  const { showLoading, hideLoading } = useLoading();
  const { hideModal } = useModal();

  const login = async () => {
    showLoading();
    try {
      setUser(await loginWithGoogle());
      hideModal();
    } catch (error) {
      console.error(error);
    } finally {
      hideLoading();
    }
  };

  return { login };
}
