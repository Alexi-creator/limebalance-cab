import { AddModal } from "@components/AddModal"
import { useModalStore } from "@store/modalStore"
// TODO(asset): временно скрыто (форма в разработке) — вернуть IconChartLine и опцию «Актив» ниже
import { IconCreditCard, IconTarget } from "@tabler/icons-react"
import type { SelectButtonOption } from "@ui/SelectButton"
import type { TFunction } from "i18next"
import type { ComponentProps } from "react"

type AddType = ComponentProps<typeof AddModal>["type"]

/** Открывает модалку добавления записи нужного типа. */
const openAdd = (type: AddType) =>
  useModalStore.getState().open({ size: "lg", centered: true, children: <AddModal type={type} /> })

/** Пункты выпадающего меню кнопки «Добавить» в шапке. */
export const getAddOptions = (t: TFunction): SelectButtonOption[] => [
  {
    label: t("header.add_transaction"),
    description: t("header.add_transaction_desc"),
    icon: <IconCreditCard size={16} />,
    onClick: () => openAdd("transaction"),
  },
  {
    label: t("header.add_goal"),
    description: t("header.add_goal_desc"),
    icon: <IconTarget size={16} />,
    onClick: () => openAdd("goal"),
  },
  // TODO(asset): временно скрыто (форма в разработке) — вернуть опцию «Актив»
  // {
  //   label: "Актив в портфель",
  //   description: "крипта",
  //   icon: <IconChartLine size={16} />,
  //   onClick: () => openAdd("asset"),
  // },
]
