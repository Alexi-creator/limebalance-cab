import { ApiError } from "@api/apiError"
import { type CreateExpensePayload, createExpense, getExpenseCategories } from "@api/expenses"
import { createIncome, getIncomeCategories } from "@api/incomes"
import { LimitAlert } from "@components/LimitAlert"
import { HttpStatus } from "@constants/httpStatus"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import { RouteNames } from "@constants/routeNames"
import { zodResolver } from "@hookform/resolvers/zod"
import { useInvalidateUsage, useUsage } from "@hooks/useUsage"
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
import { isLimitBlocked } from "@utils/subscription"
import { format } from "date-fns"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { z } from "zod"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

type CreateFormValues = {
  kind: "income" | "expense"
  amount: number | ""
  categoryId: string
  currency: string
  day: string | null
  description: string
}

interface Props {
  /** Called after a transaction is successfully created */
  onSubmit: () => void
  /** Called when the "Cancel" button is clicked */
  onCancel: () => void
  /** Preselected transaction type (e.g. when creating from a category card) */
  initialKind?: "income" | "expense"
  /** Preselected category — its id is filled into the form */
  initialCategoryId?: string
}

/**
 * Form for adding a financial transaction — income or expense (react-hook-form + zod).
 * Fetches categories of the needed type, sends a POST with the local date, and on success
 * appends the new transaction straight into the react-query cache (no refetch).
 */
export function TransactionForm({ onSubmit, onCancel, initialKind, initialCategoryId }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const { data: usage } = useUsage()
  const invalidateUsage = useInvalidateUsage()
  // the monthly transaction limit is plan-wide (expenses + incomes together)
  const limitReached = isLimitBlocked(usage?.transactions)

  const createSchema = z.object({
    kind: z.enum(["income", "expense"]),
    amount: z
      .union([z.number(), z.literal("")])
      .refine((v) => v !== "" && v > 0, t("form.amount_positive")),
    categoryId: z.string().min(1, t("form.category_required")),
    currency: z.string().min(1, t("form.currency_required")),
    day: z
      .union([z.string(), z.null()])
      .refine((v) => !!v && v.length > 0, t("form.date_required")),
    description: z.string(),
  })

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

  // the current type (expense/income) has no categories — nothing to choose
  const noCategories = !!categories && categories.length === 0

  // on type change/list load we pick the first category if the current one is not among the available ones
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

      // 1) put the transaction into the cached list for its month (if it is in the cache)
      queryClient.setQueryData<(typeof item)[]>(keys.month(monthKey), (old) =>
        old ? [item, ...old] : old,
      )

      // 2) summaries are multi-currency and convert amounts to the base currency by rates (only
      // the backend knows them) — approxTotal cannot be recomputed optimistically, so we refetch
      queryClient.invalidateQueries({ queryKey: [keys.all[0], "summary"] })

      // the combined transactions list (the "Transactions" page) — refetch with current filters
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })

      // category stats are stale — mark them to refetch when visiting "Categories"
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })

      // a created transaction moves the monthly limit counter — refresh it
      invalidateUsage()

      notifications.show({
        color: "green",
        message: isExpense ? t("transactions.expense_added") : t("transactions.income_added"),
      })
      onSubmit()
    },
    onError: (error) => {
      // the server enforces the monthly limit too (in case our counter was stale) — on 403 show
      // the same upgrade message instead of a generic error, and resync the counter
      if (error instanceof ApiError && error.status === HttpStatus.FORBIDDEN) {
        invalidateUsage()
        notifications.show({ color: "red", message: t("limits.transactions_blocked") })
        return
      }
      notifications.show({ color: "red", message: t("transactions.save_error") })
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate({
      categoryId: values.categoryId,
      amount: Number(values.amount),
      currency: values.currency,
      description: values.description,
      // date — the selected day (YYYY-MM-DD); the backend stores it in @db.Date without time.
      date: values.day as string,
    })
  })

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="lg">
        {limitReached && <LimitAlert usage={usage?.transactions} kind="transactions" />}

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
                { value: "expense", label: t("common.type_expense") },
                { value: "income", label: t("common.type_income") },
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
                label={t("common.amount")}
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
                label={t("common.currency")}
                size="md"
                w={140}
                data={CURRENCY_OPTIONS}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                searchable
                allowDeselect={false}
                nothingFoundMessage={t("common.nothing_found")}
                error={errors.currency?.message}
              />
            )}
          />
        </Group>

        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
            {t("common.category")}
          </Text>
          {noCategories ? (
            <Text size="sm" c="dimmed">
              {isExpense
                ? t("add_modal.no_categories_expense")
                : t("add_modal.no_categories_income")}{" "}
              <Anchor
                component={Link}
                to={`${RouteNames.Categories}?type=${kind}`}
                onClick={onCancel}
              >
                {t("transactions.add_group_link")}
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
                  leftSection={c.emoji || undefined}
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
              label={t("common.date")}
              maxDate={format(new Date(), "yyyy-MM-dd")}
              locale={i18n.language}
              valueFormat="DD MMM YYYY"
              error={errors.day?.message}
            />
          )}
        />

        <Textarea
          {...register("description")}
          label={t("common.note")}
          autosize
          minRows={1}
          maxRows={3}
          error={errors.description?.message}
        />

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={noCategories || limitReached}
          >
            {t("add_modal.save_transaction")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
