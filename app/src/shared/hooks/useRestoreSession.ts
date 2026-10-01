import { useEffect } from "react";
import { useLoading } from "../components/BaseLoading/loading";
import { restoreSession } from "../services/authService";
import { useAuth } from "./useAuth";

/** Gọi một lần ở gốc ứng dụng để giữ đăng nhập sau khi reload. */
export function useRestoreSession() {
  const setUser = useAuth((state) => state.setUser);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const restore = async () => {
      showLoading();
      try {
        const user = await restoreSession();
        if (user) setUser(user);
      } catch (error) {
        console.error(error);
      } finally {
        hideLoading();
      }
    };
    restore();
  }, [setUser, showLoading, hideLoading]);
}
