import { create } from "zustand";

type IAuthUser = {
  id: number;
  firebaseUid: string;
  email: string;
  name: string;
  avatar: string;
  created_at: string;
};

type IAuthState = { user: IAuthUser | null };
type IAuthActions = {
  setUser: (user: IAuthUser) => void;
  clearUser: () => void;
};

export const useAuth = create<IAuthState & IAuthActions>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
