import type { LimitUsage } from "@appTypes/usage"
import { Alert, Flex, Text } from "@mantine/core"
import { IconAlertTriangle } from "@tabler/icons-react"
import { limitLevel } from "@utils/subscription"
import { useTranslation } from "react-i18next"

interface Props {
  /** Usage for the relevant limit (`usage.categories` or `usage.transactions`). */
  usage: LimitUsage | undefined
  /** Which limit this is — picks the message and its "this month" wording for transactions. */
  kind: "categories" | "transactions"
}

/**
 * Inline limit banner. Renders nothing on unlimited plans or while there is comfortable room;
 * shows a soft "almost out" hint (1–2 left) or a red "limit reached" notice. The upgrade target
 * is text-only for now — there is no pricing page yet.
 */
export function LimitAlert({ usage, kind }: Props) {
  const { t } = useTranslation()
  const level = limitLevel(usage)

  if (level !== "soft" && level !== "blocked") return null

  const blocked = level === "blocked"
  const message = blocked
    ? t(`limits.${kind}_blocked`)
    : // remaining is a number for soft/blocked (null only on unlimited, handled above)
      t(`limits.${kind}_soft`, { count: usage?.remaining ?? 0 })

  return (
    <Alert color={blocked ? "red" : "orange"} variant="light" radius="md" p="sm">
      <Flex gap="xs" align="flex-start">
        <IconAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <Text size="sm">{message}</Text>
      </Flex>
    </Alert>
  )
}
