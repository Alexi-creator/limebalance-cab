import { useModalStore } from "@store/modalStore"
import { createElement, useEffect } from "react"
import { AddModal } from "."

export function useAddShortcut() {
  const { open } = useModalStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        open({
          size: "lg",
          centered: true,
          children: createElement(AddModal, { type: "transaction" }),
        })
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])
}
