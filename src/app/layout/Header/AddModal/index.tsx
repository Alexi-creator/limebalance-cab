import { Box, Stack, Tabs, Tooltip } from "@mantine/core"
import {
  IconArrowsExchange,
  IconArrowsUpDown,
  IconCreditCard,
  IconLock,
  IconTarget,
} from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
// TODO(asset): temporarily hidden (form under development) — restore the AssetForm import and IconChartLine
// import { AssetForm } from "./AssetForm"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { ExchangeForm } from "@/modules/exchanges/ui"
import { GoalForm } from "@/modules/goals/ui"
import { TransferForm } from "@/modules/investments/ui"
import { hasInvestmentsAccess } from "@/modules/subscription/lib/plan"
import { TransactionForm } from "@/modules/transactions/ui"
import { useModalTitle } from "@/shared/hooks/useModalTitle"
import { useModalStore } from "@/shared/store/modalStore"
import type { AddType } from "./types"

export type { AddType }

interface AddModalProps {
  /** Initial form type. Defaults to `"transaction"` */
  type?: AddType
}

/**
 * Modal container for creating financial records.
 * Contains tabs for switching between types: transaction, goal, exchange, transfer, asset.
 * The transfer tab is only offered on plans that unlock the investing section.
 * Locked single-form variants live in their own modules (`TransactionFormModal`,
 * `GoalFormModal`) so pages do not have to reach up into the app layer.
 */
export function AddModal({ type: initialType = "transaction" }: AddModalProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  // The transfers live in the investing section, which is paid. The tab stays visible without it
  // and says why it is locked — a feature you cannot see is a feature you never upgrade for.
  const canTransfer = hasInvestmentsAccess(user)
  const [type, setType] = useState<AddType>(
    initialType === "transfer" && !canTransfer ? "transaction" : initialType,
  )
  const close = useModalStore((s) => s.close)

  // the modal title lives in its header and updates on type change (tabs)
  useModalTitle(t(`add_modal.title_${type}`), t(`add_modal.sub_${type}`))

  return (
    <Stack gap={0}>
      <Tabs value={type} onChange={(v) => setType(v as AddType)} mb="md">
        <Tabs.List>
          <Tabs.Tab value="transaction" leftSection={<IconCreditCard size={14} />}>
            {t("add_modal.tab_transaction")}
          </Tabs.Tab>
          <Tabs.Tab value="goal" leftSection={<IconTarget size={14} />}>
            {t("add_modal.tab_goal")}
          </Tabs.Tab>
          <Tabs.Tab value="exchange" leftSection={<IconArrowsExchange size={14} />}>
            {t("add_modal.tab_exchange")}
          </Tabs.Tab>
          {canTransfer ? (
            <Tabs.Tab value="transfer" leftSection={<IconArrowsUpDown size={14} />}>
              {t("add_modal.tab_transfer")}
            </Tabs.Tab>
          ) : (
            // A disabled Tab has pointer-events: none, so the tooltip listens on a wrapper that
            // still receives hover — the same wrapper trick the locked sidebar links use.
            <Tooltip
              label={t("nav.investmentsLocked")}
              withArrow
              multiline
              w={220}
              events={{ hover: true, focus: true, touch: true }}
            >
              <Box>
                <Tabs.Tab value="transfer" disabled leftSection={<IconLock size={14} />}>
                  {t("add_modal.tab_transfer")}
                </Tabs.Tab>
              </Box>
            </Tooltip>
          )}
          {/* TODO(asset): temporarily hidden (form under development) — restore the tab (+ IconChartLine) */}
          {/* <Tabs.Tab value="asset" leftSection={<IconChartLine size={14} />}>
              Asset
            </Tabs.Tab> */}
        </Tabs.List>
      </Tabs>

      {type === "transaction" && <TransactionForm onSubmit={close} onCancel={close} />}
      {type === "goal" && <GoalForm onSubmit={close} onCancel={close} />}
      {type === "exchange" && <ExchangeForm onSubmit={close} onCancel={close} />}
      {/* Closes the modal through the store on its own, like the section's own copy does. */}
      {type === "transfer" && canTransfer && <TransferForm />}
      {/* TODO(asset): temporarily hidden (form under development) — restore the AssetForm render */}
      {/* {type === "asset" && <AssetForm onSubmit={close} onCancel={close} />} */}
    </Stack>
  )
}
