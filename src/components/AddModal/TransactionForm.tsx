import {
  Box,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const ACCOUNTS = ["Тинькофф", "Сбер", "Альфа", "Кэш", "Накопительный"]
const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const CATS = {
  expense: [
    { id: "Еда дома", ico: "🛒" },
    { id: "Кафе", ico: "☕" },
    { id: "Жильё", ico: "🏠" },
    { id: "Транспорт", ico: "⛽" },
    { id: "Развлечения", ico: "🎬" },
    { id: "Подписки", ico: "📱" },
    { id: "Здоровье", ico: "💪" },
    { id: "Образование", ico: "📚" },
    { id: "Накопления", ico: "🌱" },
  ],
  income: [
    { id: "Зарплата", ico: "💼" },
    { id: "Фриланс", ico: "💻" },
    { id: "Подарок", ico: "🎁" },
    { id: "Возврат", ico: "↩" },
    { id: "Дивиденды", ico: "📊" },
  ],
} as const

interface Props {
  /** Вызывается после успешной валидации и отправки формы */
  onSubmit: () => void
  /** Вызывается при нажатии кнопки «Отмена» */
  onCancel: () => void
}

/**
 * Форма добавления финансовой операции — дохода или расхода.
 * Позволяет выбрать тип, сумму, категорию, счёт, дату и добавить текстовую заметку.
 */
export function TransactionForm({ onSubmit, onCancel }: Props) {
  const [kind, setKind] = useState<"income" | "expense">("expense")
  const [amount, setAmount] = useState<number | string>("")
  const [cat, setCat] = useState("Еда дома")
  const [acc, setAcc] = useState<string | null>("Тинькофф")
  const [date, setDate] = useState<string | null>(new Date().toISOString())
  const [note, setNote] = useState("")
  const { i18n } = useTranslation()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    onSubmit()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={kind}
          onChange={(v) => setKind(v as "income" | "expense")}
          data={[
            { value: "expense", label: "− Расход" },
            { value: "income", label: "+ Доход" },
          ]}
        />

        <NumberInput
          label="Сумма"
          required
          size="md"
          autoFocus
          value={amount}
          onChange={setAmount}
          min={0}
          thousandSeparator=" "
          suffix=" ₽"
          styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)", fontSize: 22 } }}
        />

        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            Категория
          </Text>
          <Group gap={6}>
            {CATS[kind].map((c) => (
              <Button
                key={c.id}
                type="button"
                variant={cat === c.id ? "light" : "default"}
                color={cat === c.id ? "lime" : "gray"}
                size="xs"
                radius="sm"
                leftSection={<span>{c.ico}</span>}
                onClick={() => setCat(c.id)}
              >
                {c.id}
              </Button>
            ))}
          </Group>
        </Box>

        <SimpleGrid cols={2}>
          <Select label="Счёт" data={ACCOUNTS} value={acc} onChange={setAcc} />
          <DatePickerInput
            label="Дата"
            value={date}
            onChange={setDate}
            locale={i18n.language}
            valueFormat="DD MMM YYYY"
          />
        </SimpleGrid>

        <Textarea
          label="Заметка"
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={3}
        />

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">Сохранить операцию</Button>
        </Group>
      </Stack>
    </form>
  )
}
