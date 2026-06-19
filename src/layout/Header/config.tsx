import { AddModal } from "@components/AddModal"
import { useModalStore } from "@store/modalStore"
// TODO(asset): temporarily hidden (form under development) — restore IconChartLine and the "Asset" option below
import { IconCreditCard, IconTarget } from "@tabler/icons-react"
import type { SelectButtonOption } from "@ui/SelectButton"
import type { TFunction } from "i18next"
import type { ComponentProps } from "react"

type AddType = ComponentProps<typeof AddModal>["type"]

/** Opens the add-record modal of the required type. */
const openAdd = (type: AddType) =>
  useModalStore.getState().open({ size: "lg", centered: true, children: <AddModal type={type} /> })

/** Items of the header "Add" button dropdown menu. */
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
  // TODO(asset): temporarily hidden (form under development) — restore the "Asset" option
  // {
  //   label: "Add asset to portfolio",
  //   description: "crypto",
  //   icon: <IconChartLine size={16} />,
  //   onClick: () => openAdd("asset"),
  // },
]
