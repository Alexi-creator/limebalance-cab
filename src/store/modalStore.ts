import type { ModalProps } from "@mantine/core"
import type { ReactNode } from "react"
import { create } from "zustand"

type OpenModalProps = Omit<ModalProps, "opened" | "onClose">

interface ModalStore {
  isOpen: boolean
  modalProps: OpenModalProps
  open: (props?: OpenModalProps) => void
  /** Changes the title (header) of an already open modal — e.g. when switching a tab inside it. */
  setTitle: (title: ReactNode) => void
  close: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  modalProps: {},
  open: (props = {}) => set({ isOpen: true, modalProps: props }),
  setTitle: (title) => set((s) => ({ modalProps: { ...s.modalProps, title } })),
  close: () => set({ isOpen: false }),
}))
