import type { DialogProps } from "@mui/material";
import type { ReactNode } from "react";
import { create } from "zustand";

type ModalProps = {
  title?: ReactNode;
  content?: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  disableClose?: boolean;
  onClose?: () => void;
};

type ModalEntry = ModalProps & { id: number };

type State = {
  modals: ModalEntry[];
};

type Actions = {
  showModal: (props: ModalProps) => number;
  hideModal: (id?: number) => void;
  hideAllModals: () => void;
};

let nextId = 0;

export const useModal = create<State & Actions>((set, get) => ({
  modals: [],

  showModal: (props) => {
    const id = ++nextId;
    set((state) => ({ modals: [...state.modals, { ...props, id }] }));
    return id;
  },

  hideModal: (id) => {
    const { modals } = get();
    const targetId = id ?? modals[modals.length - 1]?.id;
    if (targetId === undefined) return;

    const target = modals.find((modal) => modal.id === targetId);
    target?.onClose?.();
    set((state) => ({
      modals: state.modals.filter((modal) => modal.id !== targetId),
    }));
  },

  hideAllModals: () => {
    get().modals.forEach((modal) => modal.onClose?.());
    set({ modals: [] });
  },
}));
