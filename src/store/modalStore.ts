import type { ModalProps } from "@mantine/core"
import { create } from "zustand"

type OpenModalProps = Omit<ModalProps, "opened" | "onClose">

interface ModalStore {
  isOpen: boolean
  modalProps: OpenModalProps
  open: (props?: OpenModalProps) => void
  close: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  modalProps: {},
  open: (props = {}) => set({ isOpen: true, modalProps: props }),
  close: () => set({ isOpen: false }),
}))
