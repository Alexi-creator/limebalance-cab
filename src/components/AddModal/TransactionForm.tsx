import type { CreateExpensePayload } from "@api/expenses"
import { createExpense, getExpenseCategories } from "@api/expenses"
import { createIncome, getIncomeCategories } from "@api/incomes"
import type { ExpensesSummary } from "@appTypes/expense"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { localDayToApiDate } from "@utils/localDayToApiDate"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

interface Props {
  /** Вызывается после успешного создания операции */
  onSubmit: () => void
  /** Вызывается при нажатии кнопки «Отмена» */
  onCancel: () => void
}

/**
 * Форма добавления финансовой операции — дохода или расхода.
 * Тянет категории нужного типа с бэкенда, отправляет POST с локальной датой пользователя
 * и после успеха дописывает новую операцию прямо в кеш react-query (без рефетча).
 */
export function TransactionForm({ onSubmit, onCancel }: Props) {
  const [kind, setKind] = useState<"income" | "expense">("expense")
  const [amount, setAmount] = useState<number | string>("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [day, setDay] = useState<string | null>(format(new Date(), "yyyy-MM-dd"))
  const [note, setNote] = useState("")
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()

  const isExpense = kind === "expense"

  const { data: categories } = useQuery({
    queryKey: isExpense ? expenseKeys.categories : incomeKeys.categories,
    queryFn: isExpense ? getExpenseCategories : getIncomeCategories,
    staleTime: CATEGORY_STALE_TIME,
  })

  // при смене типа/загрузке списка выбираем первую категорию, если текущей нет среди доступных
  useEffect(() => {
    if (categories?.length && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const mutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      isExpense ? createExpense(payload) : createIncome(payload),
    onSuccess: (created) => {
      const keys = isExpense ? expenseKeys : incomeKeys
      const monthKey = format(created.date, "yyyy-MM")
      const category = categories?.find((c) => c.id === created.categoryId) ?? {
        id: created.categoryId,
        name: "",
      }
      const item = { ...created, category }

      // 1) кладём операцию в закешированный список за её месяц (если он есть в кеше)
      queryClient.setQueryData<(typeof item)[]>(keys.month(monthKey), (old) =>
        old ? [item, ...old] : old,
      )

      // 2) обновляем закешированные сводки: прибавляем сумму к месяцу и к итогу
      queryClient.setQueriesData<ExpensesSummary>({ queryKey: [keys.all[0], "summary"] }, (old) => {
        if (!old) return old
        return {
          total: (parseFloat(old.total) + created.amount).toFixed(2),
          byMonth: old.byMonth.map((m) =>
            m.month === monthKey
              ? { ...m, total: (parseFloat(m.total) + created.amount).toFixed(2) }
              : m,
          ),
        }
      })

      onSubmit()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!amount || !categoryId || !day) return
        mutation.mutate({
          categoryId,
          amount: Number(amount),
          description: note,
          date: localDayToApiDate(day),
        })
      }}
    >
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
            {categories?.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant={categoryId === c.id ? "light" : "default"}
                color={categoryId === c.id ? "lime" : "gray"}
                size="xs"
                radius="sm"
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </Button>
            ))}
          </Group>
        </Box>

        <DatePickerInput
          label="Дата"
          value={day}
          onChange={setDay}
          maxDate={format(new Date(), "yyyy-MM-dd")}
          locale={i18n.language}
          valueFormat="DD MMM YYYY"
        />

        <Textarea
          label="Заметка"
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={3}
        />

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Сохранить операцию
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
