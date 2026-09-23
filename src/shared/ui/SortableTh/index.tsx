import { Group, Table, type TableThProps, UnstyledButton } from "@mantine/core"
import { IconArrowUp, IconSelector } from "@tabler/icons-react"
import type { ReactNode } from "react"

export type SortDir = "asc" | "desc"

/** Same icons the DataTable tables get (see `SORT_ICONS`), so both kinds of table read alike. */
export const SORT_ICONS = {
  sorted: <IconArrowUp size={14} />,
  unsorted: <IconSelector size={14} />,
}

/**
 * What a click on column `field` switches the sort to. A new column starts descending — the
 * biggest PnL / latest date first is what gets looked for; the second click flips it to
 * ascending, the third drops back to the table's default order. The default column itself has
 * no "unsorted" state (it *is* the unsorted order), so it just flips.
 */
export function nextSort<F extends string>(
  field: F,
  current: { sortBy: F; sortDir: SortDir },
  defaultField: F,
): { sortBy: F; sortDir: SortDir } {
  if (field !== current.sortBy) return { sortBy: field, sortDir: "desc" }
  if (current.sortDir === "desc") return { sortBy: field, sortDir: "asc" }
  if (field === defaultField) return { sortBy: field, sortDir: "desc" }
  return { sortBy: defaultField, sortDir: "desc" }
}

interface Props<F extends string> extends Omit<TableThProps, "onClick"> {
  field: F
  sortBy: F
  sortDir: SortDir
  /** The table's default order — a third click on another column returns to it (see nextSort). */
  defaultField: F
  onSort: (sortBy: F, sortDir: SortDir) => void
  children: ReactNode
}

/**
 * Header cell of a plain Mantine `Table` that sorts by its column — the `mantine-datatable`
 * `sortable` column, for tables not built on it.
 */
export function SortableTh<F extends string>({
  field,
  sortBy,
  sortDir,
  defaultField,
  onSort,
  children,
  ta,
  ...thProps
}: Props<F>) {
  const active = field === sortBy
  const next = nextSort(field, { sortBy, sortDir }, defaultField)

  return (
    <Table.Th
      ta={ta}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      {...thProps}
    >
      <UnstyledButton
        onClick={() => onSort(next.sortBy, next.sortDir)}
        fz="inherit"
        fw="inherit"
        w="100%"
        style={{ color: "inherit" }}
      >
        <Group
          gap={4}
          wrap="nowrap"
          justify={ta === "right" ? "flex-end" : ta === "center" ? "center" : "flex-start"}
        >
          {children}
          <span
            style={{
              display: "inline-flex",
              opacity: active ? 1 : 0.4,
              transform: active && sortDir === "desc" ? "rotate(180deg)" : undefined,
            }}
          >
            {active ? SORT_ICONS.sorted : SORT_ICONS.unsorted}
          </span>
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
