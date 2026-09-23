import { Select } from "@mantine/core"
import { useTranslation } from "react-i18next"
import type { SortDir } from "../SortableTh"

interface Props<F extends string> {
  /** Sortable columns, in the order listed, with their column titles. */
  fields: { value: F; label: string }[]
  sortBy: F
  sortDir: SortDir
  onChange: (sortBy: F, sortDir: SortDir) => void
}

/**
 * Sort picker for the mobile card lists, which have no column headers to click — every column
 * in both directions in one select ("PnL · descending").
 */
export function SortSelect<F extends string>({ fields, sortBy, sortDir, onChange }: Props<F>) {
  const { t } = useTranslation()

  const data = fields.flatMap(({ value, label }) =>
    (["desc", "asc"] as const).map((dir) => ({
      value: `${value}:${dir}`,
      label: `${label} · ${t(`common.sort_${dir}`)}`,
    })),
  )

  return (
    <Select
      label={t("common.sort")}
      data={data}
      value={`${sortBy}:${sortDir}`}
      onChange={(v) => {
        if (!v) return
        const [field, dir] = v.split(":")
        onChange(field as F, dir as SortDir)
      }}
      allowDeselect={false}
      w="100%"
    />
  )
}
