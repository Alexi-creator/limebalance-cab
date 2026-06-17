import { createExpenseCategory, getExpenseCategories, updateExpenseCategory } from "@api/expenses"
import { createIncomeCategory, getIncomeCategories, updateIncomeCategory } from "@api/incomes"
import type { Category, CategoryPayload } from "@appTypes/category"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ActionIcon,
  Box,
  Button,
  Group,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { EMOJI_PALETTE } from "../config"

const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

const NAME_MAX = 32

// из произвольного ввода/вставки оставляем ровно один графемный кластер (эмодзи могут
// состоять из нескольких код-юнитов); берём последний — чтобы новый символ заменял старый
function lastGrapheme(input: string): string {
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(input)]
  return graphemes.at(-1)?.segment ?? ""
}

interface Props {
  /** Передан — режим редактирования (PATCH); тип категории при этом сменить нельзя. */
  category?: Category
  /** Тип категории; в режиме создания — стартовое значение переключателя. */
  defaultType: "expense" | "income"
}

/**
 * Форма создания/редактирования категории (react-hook-form + zod). Валидирует непустое
 * имя, длину и дубль среди категорий выбранного типа; после успеха инвалидирует список,
 * статистику категорий и операции (на случай переименования).
 */
export function CategoryForm({ category, defaultType }: Props) {
  const { t } = useTranslation()
  const isEdit = !!category
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const [type, setType] = useState(defaultType)
  const isExpense = type === "expense"

  // существующие категории выбранного типа — для проверки на дубликат (берём из кеша)
  const { data: existing } = useQuery({
    queryKey: isExpense ? expenseKeys.categories : incomeKeys.categories,
    queryFn: isExpense ? getExpenseCategories : getIncomeCategories,
    staleTime: CATEGORY_STALE_TIME,
  })

  // дубликаты считаем без учёта регистра и пробелов, исключая саму редактируемую категорию
  const schema = useMemo(() => {
    const taken = new Set(
      (existing ?? []).filter((c) => c.id !== category?.id).map((c) => c.name.trim().toLowerCase()),
    )
    return z.object({
      name: z
        .string()
        .trim()
        .min(1, t("form.name_required"))
        .max(NAME_MAX, t("form.name_too_long", { max: NAME_MAX }))
        .refine((v) => !taken.has(v.toLowerCase()), t("categories.name_taken")),
      emoji: z.string(),
    })
  }, [existing, category?.id, t])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      emoji: category?.emoji ?? "",
    },
  })

  const emoji = watch("emoji")

  // поле ручного ввода держим отдельно: пустое по умолчанию, чтобы был виден плейсхолдер
  // «Свой»; при редактировании показываем текущий эмодзи, только если он не из палитры
  const [custom, setCustom] = useState(
    category?.emoji && !EMOJI_PALETTE.includes(category.emoji) ? category.emoji : "",
  )

  const mutation = useMutation({
    mutationFn: (payload: CategoryPayload) => {
      if (isEdit) {
        return isExpense
          ? updateExpenseCategory(category.id, payload)
          : updateIncomeCategory(category.id, payload)
      }
      return isExpense ? createExpenseCategory(payload) : createIncomeCategory(payload)
    },
    onSuccess: () => {
      const keys = isExpense ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      queryClient.invalidateQueries({ queryKey: keys.categories })
      // имя/эмодзи категории видны в списке операций — обновим и его
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      notifications.show({
        color: "green",
        message: isEdit ? t("categories.update_success") : t("categories.create_success"),
      })
      close()
    },
    onError: () => {
      notifications.show({ color: "red", message: t("categories.save_error") })
    },
  })

  const onSubmit = handleSubmit((values) =>
    mutation.mutate({ name: values.name.trim(), emoji: values.emoji || undefined }),
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="lg">
        {!isEdit && (
          <SegmentedControl
            fullWidth
            value={type}
            onChange={(v) => setType(v as "expense" | "income")}
            data={[
              { value: "expense", label: t("common.type_expense") },
              { value: "income", label: t("common.type_income") },
            ]}
          />
        )}

        <TextInput
          {...register("name")}
          label={t("categories.name_label")}
          autoFocus
          placeholder={
            isExpense
              ? t("categories.name_placeholder_expense")
              : t("categories.name_placeholder_income")
          }
          maxLength={NAME_MAX}
          error={errors.name?.message}
        />

        <Box>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="sm" fw={500}>
              {t("categories.emoji_label")}
            </Text>
            <TextInput
              size="xs"
              w={64}
              placeholder={t("categories.emoji_custom")}
              value={custom}
              onChange={(e) => {
                const v = lastGrapheme(e.currentTarget.value)
                setCustom(v)
                setValue("emoji", v)
              }}
              styles={{ input: { textAlign: "center" } }}
            />
          </Group>
          <ScrollArea h={132} type="auto">
            <SimpleGrid cols={8} spacing={6}>
              {EMOJI_PALETTE.map((e) => (
                <ActionIcon
                  key={e}
                  type="button"
                  size="lg"
                  radius="sm"
                  variant={emoji === e ? "light" : "default"}
                  color={emoji === e ? "lime" : "gray"}
                  onClick={() => {
                    setCustom("")
                    setValue("emoji", emoji === e ? "" : e)
                  }}
                >
                  <Text size="md">{e}</Text>
                </ActionIcon>
              ))}
            </SimpleGrid>
          </ScrollArea>
        </Box>

        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t("common.save") : t("categories.create")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
