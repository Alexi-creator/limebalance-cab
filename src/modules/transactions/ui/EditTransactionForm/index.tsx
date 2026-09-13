import { zodResolver } from "@hookform/resolvers/zod"
import { Box, Button, Group, NumberInput, Stack, Text, Textarea } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { format } from "date-fns"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { useCategories } from "@/modules/categories/api/useCategories"
import { useModalStore } from "@/shared/store/modalStore"
import { CurrencySelect } from "@/shared/ui/CurrencySelect"
import { useUpdateTransaction } from "../../api/useUpdateTransaction"
import type { Transaction } from "../../model"

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
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const isExpense = transaction.type === "expense"

  const { data: categories } = useCategories(isExpense)

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

  const mutation = useUpdateTransaction({
    transaction,
    onSuccess: () => {
      notifications.show({ color: "green", message: t("transactions.edit_success") })
      close()
    },
    onError: () => notifications.show({ color: "red", message: t("transactions.save_error") }),
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
              <CurrencySelect
                {...field}
                label={t("common.currency")}
                w={140}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
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
