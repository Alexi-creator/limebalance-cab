import { Stack, Tabs, Text } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconCreditCard, IconTarget } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
// TODO(asset): временно скрыто (форма в разработке) — вернуть импорт AssetForm и IconChartLine
// import { AssetForm } from "./AssetForm"
import { GoalForm } from "./GoalForm"
import { TransactionForm } from "./TransactionForm"
import type { AddType } from "./types"

export type { AddType }

interface AddModalProps {
  /** Начальный тип формы. По умолчанию `"transaction"` */
  type?: AddType
  /** Если `true` — скрывает вкладки и не позволяет сменить тип формы */
  lockType?: boolean
  /** Предзаполнение формы операции (например, при создании из карточки категории) */
  transactionDefaults?: { kind?: "income" | "expense"; categoryId?: string }
}

/**
 * Модальный контейнер для создания финансовых записей.
 * Содержит вкладки для переключения между типами: операция, цель, актив.
 * При `lockType=true` показывает только одну фиксированную форму без вкладок.
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

  // заголовок модалки живёт в её шапке и обновляется при смене типа (вкладки)
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
            {/* TODO(asset): временно скрыто (форма в разработке) — вернуть таб (+ IconChartLine) */}
            {/* <Tabs.Tab value="asset" leftSection={<IconChartLine size={14} />}>
              Актив
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
      {/* TODO(asset): временно скрыто (форма в разработке) — вернуть рендер AssetForm */}
      {/* {type === "asset" && <AssetForm onSubmit={close} onCancel={close} />} */}
    </Stack>
  )
}
