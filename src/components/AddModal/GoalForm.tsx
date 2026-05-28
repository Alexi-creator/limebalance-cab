import {
  ActionIcon,
  Box,
  Button,
  ColorSwatch,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const ICONS = ["🎯", "🌴", "🏡", "💻", "🚗", "🛡️", "📚", "💍", "🎓", "🎁"]
const COLORS = [
  { key: "lime", v: "var(--mantine-color-lime-4)" },
  { key: "green", v: "var(--mantine-color-green-5)" },
  { key: "yellow", v: "var(--mantine-color-yellow-5)" },
  { key: "blue", v: "var(--mantine-color-blue-5)" },
  { key: "red", v: "var(--mantine-color-red-5)" },
]

interface Props {
  onSubmit: () => void
  onCancel: () => void
}

export function GoalForm({ onSubmit, onCancel }: Props) {
  const [icon, setIcon] = useState("🎯")
  const [name, setName] = useState("")
  const [target, setTarget] = useState<number | string>("")
  const [saved, setSaved] = useState<number | string>("")
  const [date, setDate] = useState<string | null>(null)
  const [color, setColor] = useState("lime")
  const { i18n } = useTranslation()

  const hint = useMemo(() => {
    if (!target || !date) return null
    const months = Math.max(
      1,
      Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)),
    )
    const per = Math.ceil((Number(target) - Number(saved || 0)) / months)
    return `Чтобы успеть, нужно откладывать ~${per.toLocaleString("ru-RU")} ₽/мес (${months} мес.)`
  }, [target, saved, date])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !target) return
    onSubmit()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            Иконка
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
        </Box>

        <TextInput
          label="Название цели"
          required
          autoFocus
          placeholder="Например, Отпуск на Бали"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />

        <SimpleGrid cols={2}>
          <NumberInput
            label="Сумма цели"
            required
            value={target}
            onChange={setTarget}
            min={0}
            thousandSeparator=" "
            suffix=" ₽"
          />
          <NumberInput
            label="Уже накоплено"
            value={saved}
            onChange={setSaved}
            min={0}
            thousandSeparator=" "
            suffix=" ₽"
          />
        </SimpleGrid>

        <DatePickerInput
          label="Дедлайн"
          value={date}
          onChange={setDate}
          locale={i18n.language}
          valueFormat="DD MMM YYYY"
          clearable
        />

        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            Цвет
          </Text>
          <Group gap="xs">
            {COLORS.map((c) => (
              <ColorSwatch
                key={c.key}
                color={c.v}
                size={28}
                onClick={() => setColor(c.key)}
                style={{
                  cursor: "pointer",
                  outline: color === c.key ? "2px solid var(--mantine-color-lime-4)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </Group>
        </Box>

        {hint && (
          <Paper p="sm" bg="var(--mantine-color-default)">
            <Text size="sm" c="dimmed">
              {hint}
            </Text>
          </Paper>
        )}

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">Создать цель</Button>
        </Group>
      </Stack>
    </form>
  )
}
