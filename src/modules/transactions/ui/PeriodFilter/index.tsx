import { type MantineSize, Select } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useTranslation } from "react-i18next"
import {
  PERIOD_PRESETS,
  type PeriodPreset,
  type PeriodValue,
  presetRange,
  resolvePeriod,
} from "../../lib/periods"

interface Props {
  period: PeriodValue
  from?: string
  to?: string
  onChange: (update: { period: PeriodValue; from?: string; to?: string }) => void
  /** Stacked layout of the mobile drawer — the controls take the full width there. */
  vertical: boolean
  /** Control size — the trade journal's filter row runs on `xs`. */
  size?: MantineSize
}

/**
 * Period filter: the ready-made ranges people actually ask for (this month, last month, this
 * week…) in one select, with "custom range" as the last option — picking it reveals the
 * datepicker that used to be the only way to filter by date.
 *
 * A preset resolves to concrete dates the moment it is chosen, so the link stays reproducible:
 * a URL shared in March still shows March after April starts.
 */
export function PeriodFilter({ period, from, to, onChange, vertical, size }: Props) {
  const { t, i18n } = useTranslation()
  const value = resolvePeriod(period, from, to)

  const options = [
    { value: "all", label: t("transactions.period_all") },
    ...PERIOD_PRESETS.map((preset) => ({
      value: preset,
      label: t(`transactions.period_${preset}`),
    })),
    { value: "custom", label: t("transactions.period_custom") },
  ]

  const handleSelect = (next: string | null) => {
    if (!next) return
    if (next === "all") return onChange({ period: "all", from: undefined, to: undefined })
    // keep whatever dates are already set — switching to "custom" opens them for editing
    if (next === "custom") return onChange({ period: "custom", from, to })
    const preset = next as PeriodPreset
    return onChange({ period: preset, ...presetRange(preset) })
  }

  return (
    <>
      <Select
        size={size}
        label={t("transactions.period")}
        data={options}
        value={value}
        onChange={handleSelect}
        allowDeselect={false}
        w={vertical ? "100%" : 170}
      />

      {value === "custom" && (
        <DatePickerInput
          size={size}
          type="range"
          label={t("transactions.period_dates")}
          placeholder={t("transactions.date_range_placeholder")}
          valueFormat="DD MMM YYYY"
          locale={i18n.language}
          value={[from ?? null, to ?? null]}
          onChange={([nextFrom, nextTo]) =>
            onChange({
              period: "custom",
              from: nextFrom ?? undefined,
              to: nextTo ?? undefined,
            })
          }
          clearable
          allowSingleDateInRange
          w={vertical ? "100%" : 240}
        />
      )}
    </>
  )
}
