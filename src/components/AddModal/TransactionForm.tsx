import { type CreateExpensePayload, createExpense, getExpenseCategories } from "@api/expenses"
import { createIncome, getIncomeCategories } from "@api/incomes"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import { RouteNames } from "@constants/routeNames"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Anchor,
  Box,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { localDayToApiDate } from "@utils/localDayToApiDate"
import { format } from "date-fns"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { z } from "zod"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const createSchema = z.object({
  kind: z.enum(["income", "expense"]),
  amount: z
    .union([z.number(), z.literal("")])
    .refine((v) => v !== "" && v > 0, "Введите сумму больше 0"),
  categoryId: z.string().min(1, "Выберите категорию"),
  currency: z.string().min(1, "Выберите валюту"),
  day: z.union([z.string(), z.null()]).refine((v) => !!v && v.length > 0, "Укажите дату"),
  description: z.string(),
})

type CreateFormValues = z.infer<typeof createSchema>

interface Props {
  /** Вызывается после успешного создания операции */
  onSubmit: () => void
  /** Вызывается при нажатии кнопки «Отмена» */
  onCancel: () => void
  /** Предвыбранный тип операции (например, при создании из карточки категории) */
  initialKind?: "income" | "expense"
  /** Предвыбранная категория — её id подставляется в форму */
  initialCategoryId?: string
}

/**
 * Форма добавления финансовой операции — дохода или расхода (react-hook-form + zod).
 * Тянет категории нужного типа, отправляет POST с локальной датой и после успеха
 * дописывает новую операцию прямо в кеш react-query (без рефетча).
 */
export function TransactionForm({ onSubmit, onCancel, initialKind, initialCategoryId }: Props) {
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()
  const userCurrency = useAuthStore((s) => s.user?.currency)

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
      kind: initialKind ?? "expense",
      amount: "",
      categoryId: initialCategoryId ?? "",
      currency: userCurrency ?? "",
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

  // у текущего типа (расход/доход) нет ни одной категории — выбирать нечего
  const noCategories = !!categories && categories.length === 0

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

      // 2) сводки мультивалютны и приводят суммы к базовой валюте по курсам (это знает
      // только бэкенд) — оптимистично пересчитать approxTotal нельзя, поэтому рефетчим
      queryClient.invalidateQueries({ queryKey: [keys.all[0], "summary"] })

      // объединённый список операций (страница «Операции») — рефетч с текущими фильтрами
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })

      // статистика категорий устарела — пометим, чтобы перезапросилась при заходе на «Категории»
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })

      notifications.show({
        color: "green",
        message: isExpense ? "Расход добавлен" : "Доход добавлен",
      })
      onSubmit()
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate({
      categoryId: values.categoryId,
      amount: Number(values.amount),
      currency: values.currency,
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

        <Group align="flex-start" gap="sm" wrap="nowrap">
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
                error={errors.amount?.message}
                style={{ flex: 1 }}
                styles={{
                  input: { fontFamily: "var(--mantine-font-family-monospace)", fontSize: 22 },
                }}
              />
            )}
          />

          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Валюта"
                size="md"
                w={140}
                data={CURRENCY_OPTIONS}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                searchable
                allowDeselect={false}
                nothingFoundMessage="Ничего не найдено"
                error={errors.currency?.message}
              />
            )}
          />
        </Group>

        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            Категория
          </Text>
          {noCategories ? (
            <Text size="sm" c="dimmed">
              Нет ни одной {isExpense ? "категории расходов" : "категории доходов"}.{" "}
              <Anchor
                component={Link}
                to={`${RouteNames.Categories}?type=${kind}`}
                onClick={onCancel}
              >
                Добавьте группу
              </Anchor>
            </Text>
          ) : (
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
          )}
          {errors.categoryId && !noCategories && (
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
          <Button type="submit" loading={mutation.isPending} disabled={noCategories}>
            Сохранить операцию
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
