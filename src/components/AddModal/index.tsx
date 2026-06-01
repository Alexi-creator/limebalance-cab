import { Stack, Tabs, Text } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconArrowsLeftRight, IconChartLine, IconCreditCard, IconTarget } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { AssetForm } from "./AssetForm"
import { GoalForm } from "./GoalForm"
import { TransactionForm } from "./TransactionForm"
import { TransferForm } from "./TransferForm"
import type { AddType } from "./types"

export type { AddType }

const TITLES: Record<AddType, string> = {
  transaction: "Новая операция",
  goal: "Новая цель",
  asset: "Добавить актив",
  transfer: "Перевод между счетами",
}

const SUBS: Record<AddType, string> = {
  transaction: "Доход или расход — учтётся в аналитике сразу",
  goal: "LimeBalance подскажет, сколько откладывать",
  asset: "Добавьте позицию в портфель",
  transfer: "Перенос средств между вашими счетами",
}

interface AddModalProps {
  /** Начальный тип формы. По умолчанию `"transaction"` */
  type?: AddType
  /** Если `true` — скрывает вкладки и не позволяет сменить тип формы */
  lockType?: boolean
}

/**
 * Модальный контейнер для создания финансовых записей.
 * Содержит вкладки для переключения между типами: операция, цель, актив, перевод.
 * При `lockType=true` показывает только одну фиксированную форму без вкладок.
 */
export function AddModal({ type: initialType = "transaction", lockType = false }: AddModalProps) {
  const [type, setType] = useState<AddType>(initialType)
  const close = useModalStore((s) => s.close)
  const setTitle = useModalStore((s) => s.setTitle)

  // заголовок модалки живёт в её шапке и обновляется при смене типа (вкладки)
  useEffect(() => {
    setTitle(
      <Stack gap={2}>
        <Text fw={600} size="md">
          {TITLES[type]}
        </Text>
        <Text size="xs" c="dimmed">
          {SUBS[type]}
        </Text>
      </Stack>,
    )
  }, [type, setTitle])

  return (
    <Stack gap={0}>
      {!lockType && (
        <Tabs value={type} onChange={(v) => setType(v as AddType)} mb="md">
          <Tabs.List>
            <Tabs.Tab value="transaction" leftSection={<IconCreditCard size={14} />}>
              Операция
            </Tabs.Tab>
            <Tabs.Tab value="goal" leftSection={<IconTarget size={14} />}>
              Цель
            </Tabs.Tab>
            <Tabs.Tab value="asset" leftSection={<IconChartLine size={14} />}>
              Актив
            </Tabs.Tab>
            <Tabs.Tab value="transfer" leftSection={<IconArrowsLeftRight size={14} />}>
              Перевод
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}

      {type === "transaction" && <TransactionForm onSubmit={close} onCancel={close} />}
      {type === "goal" && <GoalForm onSubmit={close} onCancel={close} />}
      {type === "asset" && <AssetForm onSubmit={close} onCancel={close} />}
      {type === "transfer" && <TransferForm onSubmit={close} onCancel={close} />}
    </Stack>
  )
}
