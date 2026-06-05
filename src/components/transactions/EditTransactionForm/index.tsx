import { type UpdateTransactionPayload, updateTransaction } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Group, NumberInput, Select, Stack, Textarea } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useAuthStore } from "@store/authStore"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { localDayToApiDate } from "@utils/localDayToApiDate"
import { format } from "date-fns"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const editSchema = z.object({
  amount: z
    .union([z.number(), z.literal("")])
    .refine((v) => v !== "" && v > 0, "Введите сумму больше 0"),
  currency: z.string().min(1, "Выберите валюту"),
  day: z.union([z.string(), z.null()]).refine((v) => !!v && v.length > 0, "Укажите дату"),
  description: z.string(),
})

type EditFormValues = z.infer<typeof editSchema>

interface Props {
  transaction: Transaction
}

/**
 * Форма редактирования операции — сумма, дата, заметка с текущими значениями строки.
 * Тип и категория не меняются. После успеха локально правит запись в кеше операций (без рефетча).
 */
export function EditTransactionForm({ transaction }: Props) {
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()
  const userCurrency = useAuthStore((s) => s.user?.currency)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount: transaction.amount,
      currency: transaction.currency ?? userCurrency ?? "",
      day: format(transaction.date, "yyyy-MM-dd"),
      description: transaction.description,
    },
  })

  const mutation = useMutation({
    mutationFn: (payload: UpdateTransactionPayload) =>
      updateTransaction(transaction.type, transaction.id, payload),
    onSuccess: () => {
      // рефетч списка операций (с текущими фильтрами) — чтобы строка пересортировалась после смены даты
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      // сумма/валюта могли поменяться — статистика категорий и сводки главной устарели
      const keys = transaction.type === "expense" ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      queryClient.invalidateQueries({ queryKey: [keys.all[0], "summary"] })
      close()
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      amount: Number(values.amount),
      currency: values.currency,
      description: values.description,
      date: localDayToApiDate(values.day as string),
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
                label="Сумма"
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
                label="Валюта"
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

        <Controller
          name="day"
          control={control}
          render={({ field }) => (
            <DatePickerInput
              {...field}
              label="Дата"
              maxDate={format(new Date(), "yyyy-MM-dd")}
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
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
