import { type UpdateTransactionPayload, updateTransaction } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { transactionKeys } from "@constants/queries/transactions"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Group, NumberInput, Stack, Textarea } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
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

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount: transaction.amount,
      day: format(transaction.date, "yyyy-MM-dd"),
      description: transaction.description,
    },
  })

  const mutation = useMutation({
    mutationFn: (payload: UpdateTransactionPayload) =>
      updateTransaction(transaction.type, transaction.id, payload),
    onSuccess: () => {
      // рефетч только списка операций (с текущими фильтрами) — чтобы строка пересортировалась
      // после смены даты; категории/сводки не трогаем
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      close()
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      amount: Number(values.amount),
      description: values.description,
      date: localDayToApiDate(values.day as string),
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="lg">
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
              suffix=" ₽"
              error={errors.amount?.message}
              styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
            />
          )}
        />

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
