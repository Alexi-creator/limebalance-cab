import { Alert, Button, Group, Select, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useModalStore } from "@/shared/store/modalStore"
import { useMergeCategory } from "../../api/useMergeCategory"
import type { CategoryStats } from "../../model"

interface Props {
  category: CategoryStats
  /** Every category of the same kind (the page's current tab); the source itself is skipped. */
  categories: CategoryStats[]
  isExpense: boolean
}

/**
 * Folds a category into another one of the same kind: its transactions move over and the
 * category itself is deleted for good. Expense and income categories never mix — the list only
 * holds the current tab's kind.
 */
export function MergeCategoryForm({ category, categories, isExpense }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const [targetId, setTargetId] = useState<string | null>(null)

  const options = categories
    .filter((c) => c.id !== category.id)
    .map((c) => ({ value: c.id, label: c.emoji ? `${c.emoji} ${c.name}` : c.name }))

  const mutation = useMergeCategory({
    isExpense,
    sourceId: category.id,
    onSuccess: () => {
      notifications.show({ color: "green", message: t("categories.merge_success") })
      close()
    },
  })

  if (options.length === 0) {
    return (
      <Stack gap="md">
        <Text size="sm">{t("categories.merge_no_targets")}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            {t("common.cancel")}
          </Button>
        </Group>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Text size="sm">
        {t("categories.merge_desc", { name: category.name })}{" "}
        <Text span c="dimmed" size="sm">
          ({t("common.tx_count", { count: category.count })})
        </Text>
      </Text>

      <Select
        label={t("categories.merge_target_label")}
        placeholder={t("categories.merge_target_placeholder")}
        data={options}
        value={targetId}
        onChange={setTargetId}
        searchable
        comboboxProps={{ withinPortal: true }}
        data-autofocus
      />

      <Alert variant="light" color="red" icon={<IconAlertTriangle size={16} />} radius="md">
        {t("categories.merge_warning", { name: category.name })}
      </Alert>

      {mutation.isError && (
        <Alert variant="light" color="red" radius="md">
          {t("categories.merge_error")}
        </Alert>
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={close} disabled={mutation.isPending}>
          {t("common.cancel")}
        </Button>
        <Button
          color="red"
          disabled={!targetId}
          loading={mutation.isPending}
          onClick={() => targetId && mutation.mutate(targetId)}
        >
          {t("categories.merge_submit")}
        </Button>
      </Group>
    </Stack>
  )
}
