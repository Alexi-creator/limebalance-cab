import { Stack, Tabs, Text } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconCreditCard, IconTarget } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
// TODO(asset): temporarily hidden (form under development) — restore the AssetForm import and IconChartLine
// import { AssetForm } from "./AssetForm"
import { GoalForm } from "./GoalForm"
import { TransactionForm } from "./TransactionForm"
import type { AddType } from "./types"

export type { AddType }

interface AddModalProps {
  /** Initial form type. Defaults to `"transaction"` */
  type?: AddType
  /** If `true` — hides the tabs and disallows changing the form type */
  lockType?: boolean
  /** Prefill for the transaction form (e.g. when creating from a category card) */
  transactionDefaults?: { kind?: "income" | "expense"; categoryId?: string }
}

/**
 * Modal container for creating financial records.
 * Contains tabs for switching between types: transaction, goal, asset.
 * With `lockType=true` it shows only a single fixed form without tabs.
 */
export function AddModal({
  type: initialType = "transaction",
  lockType = false,
  transactionDefaults,
}: AddModalProps) {
  const { t } = useTranslation()
  const [type, setType] = useState<AddType>(initialType)
  const close = useModalStore((s) => s.close)
  const setTitle = useModalStore((s) => s.setTitle)

  // the modal title lives in its header and updates on type change (tabs)
  useEffect(() => {
    setTitle(
      <Stack gap={2}>
        <Text fw={600} size="md">
          {t(`add_modal.title_${type}`)}
        </Text>
        <Text size="xs" c="dimmed">
          {t(`add_modal.sub_${type}`)}
        </Text>
      </Stack>,
    )
  }, [type, setTitle, t])

  return (
    <Stack gap={0}>
      {!lockType && (
        <Tabs value={type} onChange={(v) => setType(v as AddType)} mb="md">
          <Tabs.List>
            <Tabs.Tab value="transaction" leftSection={<IconCreditCard size={14} />}>
              {t("add_modal.tab_transaction")}
            </Tabs.Tab>
            <Tabs.Tab value="goal" leftSection={<IconTarget size={14} />}>
              {t("add_modal.tab_goal")}
            </Tabs.Tab>
            {/* TODO(asset): temporarily hidden (form under development) — restore the tab (+ IconChartLine) */}
            {/* <Tabs.Tab value="asset" leftSection={<IconChartLine size={14} />}>
              Asset
            </Tabs.Tab> */}
          </Tabs.List>
        </Tabs>
      )}

      {type === "transaction" && (
        <TransactionForm
          onSubmit={close}
          onCancel={close}
          initialKind={transactionDefaults?.kind}
          initialCategoryId={transactionDefaults?.categoryId}
        />
      )}
      {type === "goal" && <GoalForm onSubmit={close} onCancel={close} />}
      {/* TODO(asset): temporarily hidden (form under development) — restore the AssetForm render */}
      {/* {type === "asset" && <AssetForm onSubmit={close} onCancel={close} />} */}
    </Stack>
  )
}
