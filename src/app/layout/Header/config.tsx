// TODO(asset): temporarily hidden (form under development) — restore IconChartLine and the "Asset" option below
import {
  IconArrowsExchange,
  IconArrowsUpDown,
  IconCreditCard,
  IconTarget,
} from "@tabler/icons-react"
import type { TFunction } from "i18next"
import type { ComponentProps } from "react"
import { useModalStore } from "@/shared/store/modalStore"
import type { SelectButtonOption } from "@/shared/ui/SelectButton"
import { AddModal } from "./AddModal"

type AddType = ComponentProps<typeof AddModal>["type"]

/** Opens the add-record modal of the required type. */
const openAdd = (type: AddType) =>
  useModalStore.getState().open({ size: "lg", centered: true, children: <AddModal type={type} /> })

/**
 * Items of the header "Add" button dropdown menu.
 *
 * `canTransfer` mirrors the plan gate on the investing section. Without it the deposit option is
 * shown locked rather than removed: a free user should be able to see what the paid plan adds,
 * which is impossible if the entry simply is not there.
 */
export const getAddOptions = (t: TFunction, canTransfer: boolean): SelectButtonOption[] => [
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
  {
    label: t("header.add_exchange"),
    description: t("header.add_exchange_desc"),
    icon: <IconArrowsExchange size={16} />,
    onClick: () => openAdd("exchange"),
  },
  {
    label: t("header.add_transfer"),
    description: t("header.add_transfer_desc"),
    icon: <IconArrowsUpDown size={16} />,
    onClick: () => openAdd("transfer"),
    lockedReason: canTransfer ? undefined : t("nav.investmentsLocked"),
  },
  // TODO(asset): temporarily hidden (form under development) — restore the "Asset" option
  // {
  //   label: "Add asset to portfolio",
  //   description: "crypto",
  //   icon: <IconChartLine size={16} />,
  //   onClick: () => openAdd("asset"),
  // },
]
