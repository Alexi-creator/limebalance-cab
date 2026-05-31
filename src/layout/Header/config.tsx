import { AddModal } from "@components/AddModal"
import { useModalStore } from "@store/modalStore"
import { IconArrowsLeftRight, IconChartLine, IconCreditCard, IconTarget } from "@tabler/icons-react"
import type { SelectButtonOption } from "@ui/SelectButton"
import type { ComponentProps } from "react"

type AddType = ComponentProps<typeof AddModal>["type"]

/** Открывает модалку добавления записи нужного типа. */
const openAdd = (type: AddType) =>
  useModalStore.getState().open({ size: "lg", centered: true, children: <AddModal type={type} /> })

/** Пункты выпадающего меню кнопки «Добавить» в шапке. */
export const ADD_OPTIONS: SelectButtonOption[] = [
  {
    label: "Операция",
    description: "доход / расход",
    icon: <IconCreditCard size={16} />,
    onClick: () => openAdd("transaction"),
  },
  {
    label: "Цель",
    description: "копилка",
    icon: <IconTarget size={16} />,
    onClick: () => openAdd("goal"),
  },
  {
    label: "Актив в портфель",
    description: "крипта",
    icon: <IconChartLine size={16} />,
    onClick: () => openAdd("asset"),
  },
  {
    label: "Перевод между счетами",
    icon: <IconArrowsLeftRight size={16} />,
    onClick: () => openAdd("transfer"),
  },
]
