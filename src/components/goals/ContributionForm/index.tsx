import { createContribution } from "@api/goals"
import type { Goal } from "@appTypes/goal"
import { CloseGoalConfirm } from "@components/goals/CloseGoalConfirm"
import { goalKeys } from "@constants/queries/goals"
import { notificationKeys } from "@constants/queries/notifications"
import { transactionKeys } from "@constants/queries/transactions"
import {
  Box,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { format } from "date-fns"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  goal: Goal
  /** Which tab is selected when the form opens. Defaults to "deposit". */
  initialMode?: "deposit" | "withdraw"
}

/**
 * Deposit into / withdraw from a goal. A withdrawal is the same endpoint with a negative amount.
 * On success the goals list, balance (money is reserved/released) and notifications (a deposit may
 * complete the goal) are invalidated.
 */
export function ContributionForm({ goal, initialMode = "deposit" }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const open = useModalStore((s) => s.open)
  const close = useModalStore((s) => s.close)

  const [mode, setMode] = useState<"deposit" | "withdraw">(initialMode)
  const [amount, setAmount] = useState<number | string>("")
  const [note, setNote] = useState("")
  const [day, setDay] = useState<string | null>(format(new Date(), "yyyy-MM-dd"))

  // Deposit can't exceed what's left to reach the target; withdrawal can't exceed what's saved.
  const maxAmount = mode === "deposit" ? goal.remaining : goal.currentAmount

  const switchMode = (v: string) => {
    const next = v as "deposit" | "withdraw"
    setMode(next)
    const nextMax = next === "deposit" ? goal.remaining : goal.currentAmount
    if (Number(amount) > nextMax) setAmount(nextMax || "")
  }

  const mutation = useMutation({
    mutationFn: () => {
      const value = Number(amount)
      return createContribution(goal.id, {
        amount: mode === "withdraw" ? -value : value,
        note: note.trim() || undefined,
        date: day ?? undefined,
      })
    },
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
      queryClient.invalidateQueries({ queryKey: goalKeys.contributions(goal.id) })
      queryClient.invalidateQueries({ queryKey: transactionKeys.balance })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      notifications.show({
        color: "green",
        message: mode === "withdraw" ? t("goals.withdraw_success") : t("goals.deposit_success"),
      })
      // A deposit that just reached the target: offer to close (archive) the goal right away.
      if (mode === "deposit" && !goal.isCompleted && updatedGoal.isCompleted) {
        open({
          centered: true,
          title: t("goals.completed_title"),
          children: <CloseGoalConfirm goal={updatedGoal} completed />,
        })
        return
      }
      close()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0 || value > maxAmount) return
    mutation.mutate()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={mode}
          onChange={switchMode}
          data={[
            { value: "deposit", label: t("goals.deposit_tab") },
            { value: "withdraw", label: t("goals.withdraw_tab") },
          ]}
        />

        <Box>
          <Text size="xs" c="dimmed">
            {goal.emoji ? `${goal.emoji} ` : ""}
            {goal.name}
          </Text>
          <Text size="sm" c="dimmed">
            {formatCurrency(goal.currentAmount, i18n.language, goal.currency)} /{" "}
            {formatCurrency(goal.targetAmount, i18n.language, goal.currency)}
          </Text>
        </Box>

        <Box>
          <NumberInput
            label={t("common.amount")}
            required
            autoFocus
            value={amount}
            onChange={setAmount}
            min={0}
            max={maxAmount}
            clampBehavior="strict"
            thousandSeparator=" "
            suffix={` ${goal.currency}`}
          />
          {maxAmount > 0 && (
            <Button
              variant="light"
              color="green"
              size="compact-xs"
              mt={6}
              onClick={() => setAmount(maxAmount)}
            >
              {t(mode === "deposit" ? "goals.fill_remaining" : "goals.fill_all", {
                amount: formatCurrency(maxAmount, i18n.language, goal.currency),
              })}
            </Button>
          )}
        </Box>

        <DatePickerInput
          label={t("common.date")}
          value={day}
          onChange={setDay}
          maxDate={format(new Date(), "yyyy-MM-dd")}
          locale={i18n.language}
          valueFormat="DD MMM YYYY"
        />

        <Textarea
          label={t("common.note")}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          maxLength={200}
          autosize
          minRows={1}
          maxRows={3}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            color={mode === "withdraw" ? "red" : undefined}
            loading={mutation.isPending}
            disabled={maxAmount <= 0}
          >
            {mode === "withdraw" ? t("goals.withdraw") : t("goals.deposit_action")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
