import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { CurrencySelect } from "@/shared/ui/CurrencySelect"
import { useSaveGoal } from "../../api/useSaveGoal"
import type { Goal } from "../../model"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const ICONS = [
  "🎯",
  "🌴",
  "🏡",
  "💻",
  "🚗",
  "🛡️",
  "📚",
  "💍",
  "🎓",
  "🎁",
  "✈️",
  "🏖️",
  "🚙",
  "🏠",
  "📱",
  "⌚",
  "🎮",
  "📷",
  "🚲",
  "🏍️",
  "💰",
  "💳",
  "🏦",
  "📈",
  "💎",
  "🪙",
  "👶",
  "🐶",
  "🐱",
  "🌱",
  "🏥",
  "💊",
  "🦷",
  "💪",
  "🎸",
  "🎨",
  "🍴",
  "☕",
  "🎄",
  "🎂",
  "👰",
  "🤵",
  "🛋️",
  "🧳",
  "⛺",
  "🛥️",
  "🏆",
  "🔧",
  "🖥️",
  "🎧",
]

interface Props {
  /** Called after successful validation and form submission */
  onSubmit: () => void
  /** Called when the "Cancel" button is clicked */
  onCancel: () => void
  /** When provided, the form edits an existing goal instead of creating a new one. */
  goal?: Goal
}

/**
 * Form for creating or editing a savings goal. For a new goal the "already saved" amount is posted
 * as an initial contribution after creation; in edit mode the saved amount is managed through the
 * contribution history instead, so that field is hidden. On success the goals list, balance and
 * notifications are invalidated.
 */
export function GoalForm({ onSubmit, onCancel, goal }: Props) {
  const isEdit = !!goal
  const { t, i18n } = useTranslation()
  const userCurrency = useAuthStore((s) => s.user?.currency)

  const [icon, setIcon] = useState(goal?.emoji ?? "🎯")
  const [name, setName] = useState(goal?.name ?? "")
  const [target, setTarget] = useState<number | string>(goal?.targetAmount ?? "")
  const [saved, setSaved] = useState<number | string>("")
  const [currency, setCurrency] = useState(goal?.currency ?? userCurrency ?? "USD")
  const [date, setDate] = useState<string | null>(
    goal?.targetDate ? format(goal.targetDate, "yyyy-MM-dd") : null,
  )

  const hint = useMemo(() => {
    if (!target || !date) return null
    const months = Math.max(
      1,
      Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)),
    )
    const per = Math.ceil((Number(target) - Number(saved || goal?.currentAmount || 0)) / months)
    return t("goal_form.hint", {
      amount: formatCurrency(per, i18n.language, currency),
      months,
    })
  }, [target, saved, date, currency, goal?.currentAmount, t, i18n.language])

  const mutation = useSaveGoal({
    goalId: isEdit ? goal.id : undefined,
    onSuccess: () => {
      notifications.show({
        color: "green",
        message: isEdit ? t("goal_form.updated") : t("goal_form.created"),
      })
      onSubmit()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !target || Number(target) <= 0) return
    mutation.mutate({
      name: name.trim(),
      emoji: icon.trim() || undefined,
      targetAmount: Number(target),
      currency,
      targetDate: date ?? undefined,
      initialAmount: Number(saved || 0),
    })
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            {t("goal_form.icon")}
          </Text>
          <Group gap={6}>
            {ICONS.map((i) => (
              <ActionIcon
                key={i}
                type="button"
                variant={icon === i ? "light" : "default"}
                color={icon === i ? "lime" : "gray"}
                size="lg"
                radius="sm"
                onClick={() => setIcon(i)}
              >
                <Text size="lg">{i}</Text>
              </ActionIcon>
            ))}
          </Group>
          <TextInput
            mt="xs"
            w={140}
            maxLength={16}
            label={t("goal_form.icon_custom")}
            placeholder="🦄"
            value={icon}
            onChange={(e) => setIcon(e.currentTarget.value)}
            styles={{ input: { textAlign: "center", fontSize: 18 } }}
          />
        </Box>

        <TextInput
          label={t("goal_form.name_label")}
          required
          autoFocus
          maxLength={100}
          placeholder={t("goal_form.name_placeholder")}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />

        <SimpleGrid cols={2}>
          <NumberInput
            label={t("goal_form.target")}
            required
            value={target}
            onChange={setTarget}
            min={0}
            thousandSeparator=" "
          />
          {isEdit ? (
            <CurrencySelect
              label={t("common.currency")}
              value={currency}
              onChange={(v) => setCurrency(v ?? currency)}
            />
          ) : (
            <NumberInput
              label={t("goal_form.saved")}
              value={saved}
              onChange={setSaved}
              min={0}
              thousandSeparator=" "
            />
          )}
        </SimpleGrid>

        {!isEdit && (
          <CurrencySelect
            label={t("common.currency")}
            value={currency}
            onChange={(v) => setCurrency(v ?? currency)}
            // full-width field here, so the dropdown follows it instead of the narrower default
            comboboxProps={{ width: "target" }}
          />
        )}

        <DatePickerInput
          label={t("goal_form.deadline")}
          value={date}
          onChange={setDate}
          locale={i18n.language}
          valueFormat="DD MMM YYYY"
          clearable
        />

        {hint && (
          <Paper p="sm" bg="var(--mantine-color-default)">
            <Text size="sm" c="dimmed">
              {hint}
            </Text>
          </Paper>
        )}

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t("common.save") : t("goal_form.create")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
