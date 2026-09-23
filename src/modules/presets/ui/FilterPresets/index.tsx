import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Popover,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
  IconBookmarks,
  IconCheck,
  IconChevronDown,
  IconDeviceFloppy,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { type KeyboardEvent, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFilterPresets } from "../../api/useFilterPresets"
import { filtersKey, hasFilters } from "../../lib/canonical"
import {
  type FilterPreset,
  type FilterPresetScope,
  type PresetFilters,
  presetConflictOf,
} from "../../model"

const NAME_MAX = 60

interface Props {
  scope: FilterPresetScope
  /** The table's current filters, defaults left out. */
  current: PresetFilters
  /** Called with a picked preset's filters — the table writes them over its own. */
  onApply: (filters: PresetFilters) => void
  size?: "xs" | "sm"
  /** Stretches the trigger to the container (the mobile filter sheet). */
  fullWidth?: boolean
}

/**
 * Saved filter sets for a table: pick one to apply it, rename or delete it, or save the current
 * filters under a name. A set that is already saved is never offered for saving again — the
 * matching preset shows as the active one instead.
 */
export function FilterPresets({ scope, current, onApply, size = "sm", fullWidth }: Props) {
  const { t } = useTranslation()
  const [opened, setOpened] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; name: string; error: string | null } | null>(
    null,
  )

  const { list, create, rename, remove } = useFilterPresets(scope)
  const presets = list.data ?? []

  const currentKey = filtersKey(current)
  const active = presets.find((p) => filtersKey(p.filters) === currentKey) ?? null
  const canSave = hasFilters(current) && !active

  const failed = () => notifications.show({ color: "red", message: t("presets.error") })

  const conflictMessage = (error: unknown) => {
    const code = presetConflictOf(error)
    if (code === "PRESET_NAME_EXISTS") return t("presets.name_taken")
    if (code === "PRESET_FILTERS_EXIST") return t("presets.filters_saved")
    return null
  }

  const close = () => {
    setOpened(false)
    setEditing(null)
    setNameError(null)
  }

  const apply = (preset: FilterPreset) => {
    onApply(preset.filters)
    close()
  }

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (presets.some((p) => p.name === trimmed)) {
      setNameError(t("presets.name_taken"))
      return
    }
    create.mutate(
      { name: trimmed, filters: current },
      {
        onSuccess: () => {
          setName("")
          setNameError(null)
          notifications.show({ color: "green", message: t("presets.saved", { name: trimmed }) })
        },
        onError: (error) => {
          const message = conflictMessage(error)
          if (message) setNameError(message)
          else failed()
        },
      },
    )
  }

  const saveRename = () => {
    if (!editing) return
    const trimmed = editing.name.trim()
    const preset = presets.find((p) => p.id === editing.id)
    if (!trimmed || trimmed === preset?.name) {
      setEditing(null)
      return
    }
    if (presets.some((p) => p.id !== editing.id && p.name === trimmed)) {
      setEditing({ ...editing, error: t("presets.name_taken") })
      return
    }
    rename.mutate(
      { id: editing.id, name: trimmed },
      {
        onSuccess: () => setEditing(null),
        onError: (error) => {
          const message = conflictMessage(error)
          if (message) setEditing((e) => e && { ...e, error: message })
          else failed()
        },
      },
    )
  }

  const onEnter = (action: () => void, cancel?: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      action()
    } else if (e.key === "Escape" && cancel) {
      e.stopPropagation()
      cancel()
    }
  }

  const row = (preset: FilterPreset) => {
    if (editing?.id === preset.id) {
      return (
        <Group key={preset.id} gap={4} wrap="nowrap" align="flex-start">
          <TextInput
            size="xs"
            style={{ flex: 1 }}
            data-autofocus
            autoFocus
            maxLength={NAME_MAX}
            value={editing.name}
            error={editing.error}
            aria-label={t("presets.name")}
            onChange={(e) => setEditing({ ...editing, name: e.currentTarget.value, error: null })}
            onKeyDown={onEnter(saveRename, () => setEditing(null))}
          />
          <ActionIcon
            variant="subtle"
            size="md"
            loading={rename.isPending}
            onClick={saveRename}
            aria-label={t("common.save")}
          >
            <IconCheck size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={() => setEditing(null)}
            aria-label={t("common.cancel")}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      )
    }

    const isActive = preset.id === active?.id
    return (
      <Group key={preset.id} gap={4} wrap="nowrap">
        <UnstyledButton
          onClick={() => apply(preset)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 8px",
            borderRadius: "var(--mantine-radius-sm)",
            backgroundColor: isActive ? "var(--mantine-primary-color-light)" : undefined,
          }}
        >
          <Group gap={6} wrap="nowrap">
            <Box w={14} style={{ flexShrink: 0, display: "flex" }}>
              {isActive && <IconCheck size={14} />}
            </Box>
            <Text size="sm" truncate>
              {preset.name}
            </Text>
          </Group>
        </UnstyledButton>
        <Tooltip label={t("presets.rename")}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={() => setEditing({ id: preset.id, name: preset.name, error: null })}
            aria-label={t("presets.rename")}
          >
            <IconPencil size={15} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("common.delete")}>
          <ActionIcon
            variant="subtle"
            color="red"
            size="md"
            loading={remove.isPending && remove.variables === preset.id}
            onClick={() => remove.mutate(preset.id, { onError: failed })}
            aria-label={t("common.delete")}
          >
            <IconTrash size={15} />
          </ActionIcon>
        </Tooltip>
      </Group>
    )
  }

  return (
    <Popover
      opened={opened}
      onChange={(o) => (o ? setOpened(true) : close())}
      position="bottom-start"
      width={fullWidth ? "target" : 300}
      shadow="md"
      trapFocus={false}
      withinPortal
    >
      <Popover.Target>
        <Group gap={4} wrap="nowrap" w={fullWidth ? "100%" : undefined}>
          <Button
            variant={active ? "light" : "default"}
            size={size}
            fullWidth={fullWidth}
            leftSection={<IconBookmarks size={14} />}
            rightSection={<IconChevronDown size={14} />}
            onClick={() => (opened ? close() : setOpened(true))}
            styles={{ label: { maxWidth: fullWidth ? undefined : 160 } }}
          >
            <Text span size={size} truncate inherit>
              {active?.name ?? t("presets.title")}
            </Text>
          </Button>
          {/* the offer to save — only for a set that has filters and is not saved yet */}
          {canSave && (
            <Tooltip label={t("presets.save_current")}>
              <ActionIcon
                variant="light"
                size={`input-${size}`}
                onClick={() => setOpened(true)}
                aria-label={t("presets.save_current")}
              >
                <IconDeviceFloppy size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" px={4}>
            {t("presets.title")}
          </Text>

          {list.isLoading ? (
            <Group justify="center" py="xs">
              <Loader size="sm" />
            </Group>
          ) : presets.length === 0 ? (
            <Text size="sm" c="dimmed" px={4}>
              {t("presets.empty")}
            </Text>
          ) : (
            <ScrollArea.Autosize mah={260} type="auto">
              <Stack gap={2}>{presets.map(row)}</Stack>
            </ScrollArea.Autosize>
          )}

          <Divider />

          {canSave ? (
            <Group gap={4} wrap="nowrap" align="flex-start">
              <TextInput
                size="xs"
                style={{ flex: 1 }}
                placeholder={t("presets.name_placeholder")}
                aria-label={t("presets.name")}
                maxLength={NAME_MAX}
                value={name}
                error={nameError}
                onChange={(e) => {
                  setName(e.currentTarget.value)
                  setNameError(null)
                }}
                onKeyDown={onEnter(save)}
              />
              <Button
                size="xs"
                leftSection={<IconDeviceFloppy size={14} />}
                disabled={!name.trim()}
                loading={create.isPending}
                onClick={save}
              >
                {t("common.save")}
              </Button>
            </Group>
          ) : (
            <Text size="xs" c="dimmed" px={4}>
              {active
                ? t("presets.already_saved", { name: active.name })
                : t("presets.nothing_to_save")}
            </Text>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
