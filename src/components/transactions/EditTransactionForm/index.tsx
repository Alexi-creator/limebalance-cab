import { getExpenseCategories } from "@api/expenses"
import { getIncomeCategories } from "@api/incomes"
import { type UpdateTransactionPayload, updateTransaction } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import { zodResolver } from "@hookform/resolvers/zod"
import { Box, Button, Group, NumberInput, Select, Stack, Text, Textarea } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

type EditFormValues = {
  amount: number | ""
  categoryId: string
  currency: string
  day: string | null
  description: string
}

interface Props {
  transaction: Transaction
}

/**
 * Transaction edit form — amount, category, date, note with the row's current values.
 * Type does not change. On success it edits the record locally in the transactions cache (no refetch).
 */
export function EditTransactionForm({ transaction }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const isExpense = transaction.type === "expense"

  const { data: categories } = useQuery({
    queryKey: isExpense ? expenseKeys.categories : incomeKeys.categories,
    queryFn: isExpense ? getExpenseCategories : getIncomeCategories,
    staleTime: CATEGORY_STALE_TIME,
  })

  const editSchema = z.object({
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
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      currency: transaction.currency ?? userCurrency ?? "",
      day: format(transaction.date, "yyyy-MM-dd"),
      description: transaction.description,
    },
  })

  const categoryId = watch("categoryId")

  const mutation = useMutation({
    mutationFn: (payload: UpdateTransactionPayload) =>
      updateTransaction(transaction.type, transaction.id, payload),
    onSuccess: () => {
      // refetch the transactions list (with current filters) — so the row re-sorts after a date change
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      // the amount/currency may have changed — category stats and home summaries are stale
      const keys = transaction.type === "expense" ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      queryClient.invalidateQueries({ queryKey: [keys.all[0], "summary"] })
      notifications.show({ color: "green", message: t("transactions.edit_success") })
      close()
    },
    onError: () => {
      notifications.show({ color: "red", message: t("transactions.save_error") })
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      amount: Number(values.amount),
      categoryId: values.categoryId,
      currency: values.currency,
      description: values.description,
      // date — the selected day (YYYY-MM-DD); the backend stores it in @db.Date without time.
      date: values.day as string,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="lg">
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                label={t("common.amount")}
                hideControls
                min={0}
                thousandSeparator=" "
                error={errors.amount?.message}
                style={{ flex: 1 }}
                styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
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
              label={t("common.date")}
              maxDate={format(new Date(), "yyyy-MM-dd")}
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
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t("common.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
