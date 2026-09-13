import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Button, Group, NumberInput, Stack, Text, Textarea } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { IconInfoCircle } from "@tabler/icons-react"
import { format } from "date-fns"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { useBalance } from "@/modules/transactions/api/useBalance"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { CurrencySelect } from "@/shared/ui/CurrencySelect"
import { useSaveExchange } from "../../api/useSaveExchange"
import type { Exchange } from "../../model"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

type ExchangeFormValues = {
  fromAmount: number | ""
  fromCurrency: string
  toAmount: number | ""
  toCurrency: string
  day: string | null
  description: string
}

interface Props {
  /** Called after the exchange is successfully saved. */
  onSubmit: () => void
  /** Called when "Cancel" is clicked. */
  onCancel: () => void
  /** Existing exchange — the form edits it instead of creating a new one. */
  exchange?: Exchange
}

/**
 * Form for recording a currency exchange: what was handed over and what was actually received.
 *
 * Only the two amounts matter here. This app tracks where money is, not how well it was traded,
 * so no rate is shown — and the exchange never becomes an income or an expense, it only moves
 * money between the per-currency balances.
 */
export function ExchangeForm({ onSubmit, onCancel, exchange }: Props) {
  const { t, i18n } = useTranslation()
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const balanceQuery = useBalance()

  const schema = z
    .object({
      fromAmount: z
        .union([z.number(), z.literal("")])
        .refine((v) => v !== "" && v > 0, t("form.amount_positive")),
      fromCurrency: z.string().min(1, t("form.currency_required")),
      toAmount: z
        .union([z.number(), z.literal("")])
        .refine((v) => v !== "" && v > 0, t("form.amount_positive")),
      toCurrency: z.string().min(1, t("form.currency_required")),
      day: z
        .union([z.string(), z.null()])
        .refine((v) => !!v && v.length > 0, t("form.date_required")),
      description: z.string(),
    })
    // An exchange of a currency for itself is not an exchange — the backend rejects it too.
    .refine((v) => v.fromCurrency !== v.toCurrency, {
      message: t("exchanges.same_currency"),
      path: ["toCurrency"],
    })

  // Money is usually exchanged INTO the currency you live in, so the target defaults to the
  // user's own. The source then defaults to USD — unless that is already the target, in which
  // case it is left empty rather than pre-filled with a pair that cannot be saved.
  const defaultTo = exchange?.toCurrency ?? userCurrency ?? ""
  const defaultFrom = exchange?.fromCurrency ?? (defaultTo === "USD" ? "" : "USD")

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExchangeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAmount: exchange?.fromAmount ?? "",
      fromCurrency: defaultFrom,
      toAmount: exchange?.toAmount ?? "",
      toCurrency: defaultTo,
      day: format(exchange?.date ?? new Date(), "yyyy-MM-dd"),
      description: exchange?.description ?? "",
    },
  })

  const mutation = useSaveExchange({
    exchangeId: exchange?.id,
    onSuccess: () => {
      notifications.show({ color: "green", message: t("exchanges.saved") })
      onSubmit()
    },
    onError: () => notifications.show({ color: "red", message: t("exchanges.save_error") }),
  })

  const submit = handleSubmit((values) =>
    mutation.mutate({
      fromCurrency: values.fromCurrency,
      fromAmount: Number(values.fromAmount),
      toCurrency: values.toCurrency,
      toAmount: Number(values.toAmount),
      date: values.day as string,
      description: values.description,
    }),
  )

  const amountStyles = {
    input: { fontFamily: "var(--mantine-font-family-monospace)", fontSize: 22 },
  }

  // What the records say can still be handed over. Shown here rather than on the dashboard
  // because this is where the number is needed: to zero out a currency you have to know how much
  // of it is left, and copying a seven-digit figure by hand is how mistakes get made.
  // Only positive balances are listed — a negative one is not money to give away but the hole the
  // money is missing from, and reading "your records show −422,924" is more confusing than useful.
  const held = (balanceQuery.data?.byCurrency ?? []).filter((c) => c.amount > 0)

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="lg">
        <Alert variant="light" color="gray" icon={<IconInfoCircle size={16} />} p="sm">
          <Text size="xs">{t("exchanges.not_a_transaction")}</Text>
        </Alert>

        {held.length > 0 && (
          <Stack gap={6}>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t("exchanges.holdings")}
            </Text>
            <Group gap={6}>
              {held.map((c) => (
                // One click fills both "gave" fields, so a seven-digit figure is never retyped.
                <Button
                  key={c.currency}
                  type="button"
                  size="compact-xs"
                  variant="light"
                  color="gray"
                  onClick={() => {
                    setValue("fromCurrency", c.currency, { shouldValidate: true })
                    setValue("fromAmount", c.amount, { shouldValidate: true })
                  }}
                >
                  {formatCurrency(c.amount, i18n.language, c.currency)}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        <Group align="flex-start" gap="sm" wrap="nowrap">
          <Controller
            name="fromAmount"
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                label={t("exchanges.gave")}
                size="md"
                autoFocus
                hideControls
                min={0}
                thousandSeparator=" "
                error={errors.fromAmount?.message}
                style={{ flex: 1 }}
                styles={amountStyles}
              />
            )}
          />
          <Controller
            name="fromCurrency"
            control={control}
            render={({ field }) => (
              <CurrencySelect
                {...field}
                label={t("common.currency")}
                size="md"
                w={140}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                error={errors.fromCurrency?.message}
              />
            )}
          />
        </Group>

        <Group align="flex-start" gap="sm" wrap="nowrap">
          <Controller
            name="toAmount"
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                label={t("exchanges.got")}
                size="md"
                hideControls
                min={0}
                thousandSeparator=" "
                error={errors.toAmount?.message}
                style={{ flex: 1 }}
                styles={amountStyles}
              />
            )}
          />
          <Controller
            name="toCurrency"
            control={control}
            render={({ field }) => (
              <CurrencySelect
                {...field}
                label={t("common.currency")}
                size="md"
                w={140}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                error={errors.toCurrency?.message}
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
          placeholder={t("exchanges.note_placeholder")}
          autosize
          minRows={1}
          maxRows={3}
          error={errors.description?.message}
        />

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t("add_modal.save_exchange")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
