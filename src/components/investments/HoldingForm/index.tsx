import { createHolding, type HoldingPayload, updateHolding } from "@api/investing"
import type { Holding } from "@appTypes/investing"
import { investingKeys } from "@constants/queries/investing"
import { Button, Group, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  /** When set the form edits it, otherwise adds a new asset. */
  holding?: Holding
}

/** 1–15 letters/digits; the backend uppercases it itself, we mirror that in the input. */
const ASSET_RE = /^[A-Z0-9]{1,15}$/

export function HoldingForm({ holding }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const [asset, setAsset] = useState(holding?.asset ?? "")
  const [amount, setAmount] = useState<number | string>(holding?.amount ?? "")
  const [avgBuyPrice, setAvgBuyPrice] = useState<number | string>(holding?.avgBuyPrice ?? "")
  const [location, setLocation] = useState(holding?.location ?? "")
  const [note, setNote] = useState(holding?.note ?? "")

  const mutation = useMutation({
    mutationFn: () => {
      const payload: HoldingPayload = {
        asset: asset.trim().toUpperCase(),
        amount: Number(amount),
        avgBuyPrice: avgBuyPrice === "" ? null : Number(avgBuyPrice),
        location: location.trim() || undefined,
        note: note.trim() || null,
      }
      return holding ? updateHolding(holding.id, payload) : createHolding(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investingKeys.holdings })
      notifications.show({
        color: "green",
        message: t(holding ? "investments.hold_updated" : "investments.hold_created"),
      })
      close()
    },
    onError: (err) => {
      notifications.show({ color: "red", message: err.message })
    },
  })

  const valid = ASSET_RE.test(asset.trim().toUpperCase()) && Number(amount) > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    mutation.mutate()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Group grow align="flex-start">
          <TextInput
            label={t("investments.hold_asset")}
            placeholder="BTC"
            required
            autoFocus={!holding}
            value={asset}
            onChange={(e) => setAsset(e.currentTarget.value.toUpperCase())}
            maxLength={15}
            error={
              asset && !ASSET_RE.test(asset.trim().toUpperCase())
                ? t("investments.hold_asset_error")
                : undefined
            }
          />
          <NumberInput
            label={t("common.amount")}
            required
            value={amount}
            onChange={setAmount}
            min={0}
            decimalScale={8}
          />
        </Group>

        <Group grow align="flex-start">
          <NumberInput
            label={t("investments.hold_avg_buy_price")}
            description={t("investments.hold_avg_buy_price_hint")}
            value={avgBuyPrice}
            onChange={setAvgBuyPrice}
            min={0}
            decimalScale={8}
            prefix="$"
          />
          <TextInput
            label={t("investments.hold_location")}
            placeholder={t("investments.hold_location_placeholder")}
            value={location}
            onChange={(e) => setLocation(e.currentTarget.value)}
            maxLength={50}
          />
        </Group>

        <Textarea
          label={t("common.note")}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          maxLength={200}
          autosize
          minRows={1}
          maxRows={3}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!valid}>
            {t("common.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
