import { create } from "zustand";

type State = {
  isLoading: boolean;
};

type Actions = {
  showLoading: () => void;
  hideLoading: () => void;
};

export const useLoading = create<State & Actions>((set) => ({
  isLoading: false,
  showLoading: () => set({ isLoading: true }),
  hideLoading: () => set({ isLoading: false }),
}));
