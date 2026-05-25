import {
  ActionIcon,
  Affix,
  Box,
  Button,
  ColorSwatch,
  Divider,
  Group,
  Modal,
  Notification,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Transition,
} from "@mantine/core"
import {
  IconArrowsLeftRight,
  IconChartLine,
  IconCheck,
  IconCreditCard,
  IconTarget,
} from "@tabler/icons-react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type AddType = "transaction" | "goal" | "asset" | "transfer"

interface OpenOpts {
  lockType?: boolean
}
interface Ctx {
  open: (type?: AddType, opts?: OpenOpts) => void
}

const AddContext = createContext<Ctx>({ open: () => {} })
export const useAdd = () => useContext(AddContext)

export function AddProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<AddType>("transaction")
  const [lockType, setLockType] = useState(false)
  const [toast, setToast] = useState<{ title: string; detail?: string } | null>(null)

  const openModal: Ctx["open"] = (t = "transaction", opts = {}) => {
    setType(t)
    setLockType(!!opts.lockType)
    setOpen(true)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        openModal("transaction")
      }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])

  const onSubmit = (t: AddType, summary?: string) => {
    setOpen(false)
    const titles: Record<AddType, string> = {
      transaction: "Операция добавлена",
      goal: "Цель создана",
      asset: "Актив добавлен",
      transfer: "Перевод выполнен",
    }
    setToast({ title: titles[t], detail: summary })
    setTimeout(() => setToast(null), 3200)
  }

  const ctx = useMemo(() => ({ open: openModal }), [])

  return (
    <AddContext.Provider value={ctx}>
      {children}

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        size="lg"
        radius="md"
        centered
        title={
          <Stack gap={2}>
            <Text fw={600} size="md">
              {TITLES[type]}
            </Text>
            <Text size="xs" c="dimmed">
              {SUBS[type]}
            </Text>
          </Stack>
        }
      >
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

        {type === "transaction" && (
          <TransactionForm onSubmit={(s) => onSubmit("transaction", s)} onCancel={() => setOpen(false)} />
        )}
        {type === "goal" && (
          <GoalForm onSubmit={(s) => onSubmit("goal", s)} onCancel={() => setOpen(false)} />
        )}
        {type === "asset" && (
          <AssetForm onSubmit={(s) => onSubmit("asset", s)} onCancel={() => setOpen(false)} />
        )}
        {type === "transfer" && (
          <TransferForm onSubmit={(s) => onSubmit("transfer", s)} onCancel={() => setOpen(false)} />
        )}
      </Modal>

      <Affix position={{ bottom: 24, right: 24 }} zIndex={500}>
        <Transition mounted={!!toast} transition="slide-up" duration={200}>
          {(styles) =>
            toast ? (
              <Notification
                style={styles}
                icon={<IconCheck size={16} />}
                color="lime"
                title={toast.title}
                withCloseButton
                onClose={() => setToast(null)}
              >
                {toast.detail}
              </Notification>
            ) : (
              <span />
            )
          }
        </Transition>
      </Affix>
    </AddContext.Provider>
  )
}

const TITLES: Record<AddType, string> = {
  transaction: "Новая операция",
  goal: "Новая цель",
  asset: "Добавить актив",
  transfer: "Перевод между счетами",
}
const SUBS: Record<AddType, string> = {
  transaction: "Доход или расход — учтётся в аналитике сразу",
  goal: "Cashflowy подскажет, сколько откладывать",
  asset: "Добавьте позицию в портфель",
  transfer: "Перенос средств между вашими счетами",
}

const ACCOUNTS = ["Тинькофф", "Сбер", "Альфа", "Кэш", "Накопительный"]

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

function TransactionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (s: string) => void
  onCancel: () => void
}) {
  const [kind, setKind] = useState<"income" | "expense">("expense")
  const [amount, setAmount] = useState<number | string>("")
  const [cat, setCat] = useState("Еда дома")
  const [acc, setAcc] = useState<string | null>("Тинькофф")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")

  const cats = {
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    onSubmit(`${kind === "income" ? "+" : "-"}${Number(amount).toLocaleString("ru-RU")} ₽ · ${cat}`)
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
            {cats[kind].map((c) => (
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
          <TextInput label="Дата" type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
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

function GoalForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (s: string) => void
  onCancel: () => void
}) {
  const [icon, setIcon] = useState("🎯")
  const [name, setName] = useState("")
  const [target, setTarget] = useState<number | string>("")
  const [saved, setSaved] = useState<number | string>("")
  const [date, setDate] = useState("")
  const [color, setColor] = useState("lime")

  const colors = [
    { key: "lime", v: "var(--mantine-color-lime-4)" },
    { key: "green", v: "var(--mantine-color-green-5)" },
    { key: "yellow", v: "var(--mantine-color-yellow-5)" },
    { key: "blue", v: "var(--mantine-color-blue-5)" },
    { key: "red", v: "var(--mantine-color-red-5)" },
  ]
  const icons = ["🎯", "🌴", "🏡", "💻", "🚗", "🛡️", "📚", "💍", "🎓", "🎁"]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !target) return
    onSubmit(`${name} · ${Number(target).toLocaleString("ru-RU")} ₽`)
  }

  const hint = useMemo(() => {
    if (!target || !date) return null
    const months = Math.max(1, Math.ceil((+new Date(date) - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
    const per = Math.ceil((Number(target) - Number(saved || 0)) / months)
    return `Чтобы успеть, нужно откладывать ~${per.toLocaleString("ru-RU")} ₽/мес (${months} мес.)`
  }, [target, saved, date])

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            Иконка
          </Text>
          <Group gap={6}>
            {icons.map((i) => (
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

        <TextInput
          label="Дедлайн"
          type="date"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
        />

        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            Цвет
          </Text>
          <Group gap="xs">
            {colors.map((c) => (
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

function AssetForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (s: string) => void
  onCancel: () => void
}) {
  const [sym, setSym] = useState("")
  const [amount, setAmount] = useState<number | string>("")
  const [avg, setAvg] = useState<number | string>("")
  const popular = ["BTC", "ETH", "SOL", "TON", "USDT", "BNB", "XRP", "DOGE", "ADA", "AVAX"]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (sym && amount) onSubmit(`${amount} ${sym}`)
      }}
    >
      <Stack gap="md">
        <TextInput
          label="Тикер актива"
          required
          autoFocus
          placeholder="BTC"
          value={sym}
          onChange={(e) => setSym(e.currentTarget.value.toUpperCase())}
          styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
        />
        <Group gap={6}>
          {popular.map((s) => (
            <Button
              key={s}
              type="button"
              size="xs"
              radius="sm"
              variant={sym === s ? "light" : "default"}
              color={sym === s ? "lime" : "gray"}
              onClick={() => setSym(s)}
            >
              {s}
            </Button>
          ))}
        </Group>
        <SimpleGrid cols={2}>
          <NumberInput
            label="Количество"
            required
            min={0}
            placeholder="0.5"
            value={amount}
            onChange={setAmount}
            decimalScale={8}
          />
          <NumberInput
            label="Средняя цена"
            min={0}
            placeholder="68 420"
            value={avg}
            onChange={setAvg}
            prefix="$"
            thousandSeparator=" "
          />
        </SimpleGrid>
        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">Добавить в портфель</Button>
        </Group>
      </Stack>
    </form>
  )
}

function TransferForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (s: string) => void
  onCancel: () => void
}) {
  const [from, setFrom] = useState<string | null>("Тинькофф")
  const [to, setTo] = useState<string | null>("Сбер")
  const [amount, setAmount] = useState<number | string>("")
  const sameAcc = from === to

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (amount && !sameAcc)
          onSubmit(`${Number(amount).toLocaleString("ru-RU")} ₽ · ${from} → ${to}`)
      }}
    >
      <Stack gap="md">
        <NumberInput
          label="Сумма"
          required
          autoFocus
          size="md"
          value={amount}
          onChange={setAmount}
          min={0}
          thousandSeparator=" "
          suffix=" ₽"
          styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)", fontSize: 22 } }}
        />
        <SimpleGrid cols={2}>
          <Select
            label="Из счёта"
            data={ACCOUNTS}
            value={from}
            onChange={setFrom}
            error={sameAcc ? " " : undefined}
          />
          <Select
            label="В счёт"
            data={ACCOUNTS}
            value={to}
            onChange={setTo}
            error={sameAcc ? "Должны быть разные" : undefined}
          />
        </SimpleGrid>
        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" disabled={sameAcc}>
            Перевести
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
