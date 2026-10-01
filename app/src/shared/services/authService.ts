import { signOut } from "firebase/auth";
import { SYSTEM_APIS } from "../configs/api";
import { auth, signInWithGooglePopup } from "../configs/firebaseConfig";
import type { IAuthUser } from "../hooks/useAuth";

async function requestUserByIdToken(idToken: string): Promise<IAuthUser> {
  const response = await fetch(SYSTEM_APIS.authGoogle, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/** Khôi phục user từ phiên Firebase đã lưu (sau khi reload); null nếu chưa đăng nhập. */
export async function restoreSession(): Promise<IAuthUser | null> {
  await auth.authStateReady();
  if (!auth.currentUser) return null;
  return requestUserByIdToken(await auth.currentUser.getIdToken());
}

export function logout() {
  return signOut(auth);
}

/** Mở popup Google, xác thực với server và trả về thông tin user. */
export async function loginWithGoogle(): Promise<IAuthUser> {
  const { user } = await signInWithGooglePopup();
  const idToken = await user.getIdToken();
  return requestUserByIdToken(idToken);
}
