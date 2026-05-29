import { Modal } from "@mantine/core"
import { useModalStore } from "@store/modalStore"

/**
 * Глобальный модальный контейнер приложения.
 * Не принимает пропсов — состояние (открыт/закрыт, содержимое) читается из `useModalStore`.
 * Размещается один раз на уровне App.
 */
export function GlobalModal() {
  const { isOpen, modalProps, close } = useModalStore()
  return <Modal opened={isOpen} onClose={close} {...modalProps} />
}
