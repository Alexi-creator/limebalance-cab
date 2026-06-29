import { Group, type MantineSpacing, Pill, Stack, Text } from "@mantine/core"

export interface ChipGroup {
  /** Group title, e.g. "Category". */
  label: string
  items: { value: string; label: string }[]
  onRemove: (value: string) => void
}

interface Props {
  groups: ChipGroup[]
  /** Horizontal padding — flush with the card edges over the table, `0` inside the drawer. */
  px?: MantineSpacing
  /** Bottom separator — shown over the table, omitted inside the drawer. */
  withBorder?: boolean
}

/**
 * Removable chips for the active multi-select filters, shown above the table (and inside the
 * mobile filter drawer) so it stays visible what the list is filtered by — the filter controls
 * themselves only show a count. Renders nothing when no group has any selected item.
 */
export function ActiveFilterChips({ groups, px = "md", withBorder = true }: Props) {
  const visible = groups.filter((g) => g.items.length > 0)
  if (visible.length === 0) return null

  return (
    <Stack
      gap="xs"
      px={px}
      py="xs"
      style={{
        borderBottom: withBorder ? "1px solid var(--mantine-color-default-border)" : undefined,
        flexShrink: 0,
      }}
    >
      {visible.map((group) => (
        <Group key={group.label} gap="xs" wrap="wrap">
          <Text size="xs" c="dimmed" fw={500}>
            {group.label}:
          </Text>
          {group.items.map((item) => (
            <Pill
              key={item.value}
              withRemoveButton
              onRemove={() => group.onRemove(item.value)}
              styles={{
                // the default pill background is near-transparent and disappears on the dark
                // card — give it a solid gray that adapts to the color scheme
                root: {
                  backgroundColor:
                    "light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))",
                },
              }}
            >
              {item.label}
            </Pill>
          ))}
        </Group>
      ))}
    </Stack>
  )
}
