import { Modal } from "@mantine/core"
import { useModalStore } from "@store/modalStore"

export function GlobalModal() {
  const { isOpen, modalProps, close } = useModalStore()
  return <Modal opened={isOpen} onClose={close} {...modalProps} />
}
