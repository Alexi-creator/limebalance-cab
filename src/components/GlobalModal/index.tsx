import { Modal } from "@mantine/core"
import { useModalStore } from "@store/modalStore"

/**
 * The app's global modal container.
 * Takes no props — the state (open/closed, content) is read from `useModalStore`.
 * Mounted once at the App level.
 */
export function GlobalModal() {
  const { isOpen, modalProps, close } = useModalStore()
  return <Modal opened={isOpen} onClose={close} {...modalProps} />
}
