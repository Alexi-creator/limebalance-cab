import { type CreateExpensePayload, createExpense, getExpenseCategories } from "@api/expenses"
import { createIncome, getIncomeCategories } from "@api/incomes"
import type { ExpensesSummary } from "@appTypes/expense"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const createSchema = z.object({
  kind: z.enum(["income", "expense"]),
  amount: z
    .union([z.number(), z.literal("")])
    .refine((v) => v !== "" && v > 0, "Введите сумму больше 0"),
  categoryId: z.string().min(1, "Выберите категорию"),
  day: z.union([z.string(), z.null()]).refine((v) => !!v && v.length > 0, "Укажите дату"),
  description: z.string(),
})

type CreateFormValues = z.infer<typeof createSchema>

interface Props {
  /** Вызывается после успешного создания операции */
  onSubmit: () => void
  /** Вызывается при нажатии кнопки «Отмена» */
  onCancel: () => void
}

/**
 * Форма добавления финансовой операции — дохода или расхода (react-hook-form + zod).
 * Тянет категории нужного типа, отправляет POST с локальной датой и после успеха
 * дописывает новую операцию прямо в кеш react-query (без рефетча).
 */
export function TransactionForm({ onSubmit, onCancel }: Props) {
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      kind: "expense",
      amount: "",
      categoryId: "",
      day: format(new Date(), "yyyy-MM-dd"),
      description: "",
    },
  })

  const kind = watch("kind")
  const categoryId = watch("categoryId")
  const isExpense = kind === "expense"

  const { data: categories } = useQuery({
    queryKey: isExpense ? expenseKeys.categories : incomeKeys.categories,
    queryFn: isExpense ? getExpenseCategories : getIncomeCategories,
    staleTime: CATEGORY_STALE_TIME,
  })

  // при смене типа/загрузке списка выбираем первую категорию, если текущей нет среди доступных
  useEffect(() => {
    if (categories?.length && !categories.some((c) => c.id === categoryId)) {
      setValue("categoryId", categories[0].id)
    }
  }, [categories, categoryId, setValue])

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

      // объединённый список операций (страница «Операции») — рефетч с текущими фильтрами
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })

      onSubmit()
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate({
      categoryId: values.categoryId,
      amount: Number(values.amount),
      description: values.description,
      date: localDayToApiDate(values.day as string),
    })
  })

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="lg">
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              fullWidth
              value={field.value}
              onChange={(v) => {
                field.onChange(v)
                setValue("categoryId", "")
              }}
              data={[
                { value: "expense", label: "− Расход" },
                { value: "income", label: "+ Доход" },
              ]}
            />
          )}
        />

        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <NumberInput
              {...field}
              label="Сумма"
              size="md"
              autoFocus
              hideControls
              min={0}
              thousandSeparator=" "
              suffix=" ₽"
              error={errors.amount?.message}
              styles={{
                input: { fontFamily: "var(--mantine-font-family-monospace)", fontSize: 22 },
              }}
            />
          )}
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
                onClick={() => setValue("categoryId", c.id, { shouldValidate: true })}
              >
                {c.name}
              </Button>
            ))}
          </Group>
          {errors.categoryId && (
            <Text size="xs" c="red.6" mt={6}>
              {errors.categoryId.message}
            </Text>
          )}
        </Box>

        <Controller
          name="day"
          control={control}
          render={({ field }) => (
            <DatePickerInput
              {...field}
              label="Дата"
              maxDate={format(new Date(), "yyyy-MM-dd")}
              locale={i18n.language}
              valueFormat="DD MMM YYYY"
              error={errors.day?.message}
            />
          )}
        />

        <Textarea
          {...register("description")}
          label="Заметка"
          autosize
          minRows={1}
          maxRows={3}
          error={errors.description?.message}
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
