import { syncExchangeAccount } from "@api/investing"
import type { ExchangeAccount } from "@appTypes/investing"
import { ConnectAccountForm } from "@components/investments/ConnectAccountForm"
import { DeleteAccountConfirm } from "@components/investments/DeleteAccountConfirm"
import { RenameAccountForm } from "@components/investments/RenameAccountForm"
import { investingKeys } from "@constants/queries/investing"
import { dateFnsLocales } from "@i18n/languages.ts"
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { IconEdit, IconPlugConnected, IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"

interface Props {
  accounts: ExchangeAccount[]
  isLoading: boolean
}

const STATUS_COLOR: Record<ExchangeAccount["status"], string> = {
  ACTIVE: "var(--mantine-color-green-5)",
  ERROR: "var(--mantine-color-red-5)",
  DISABLED: "var(--mantine-color-dimmed)",
}

/**
 * Exchange (Bybit) accounts: onboarding card when the list is empty, otherwise
 * the account rows with sync status. History is pulled in the background by the
 * backend cron; while `lastSyncAt` is null the page-level query polls the list.
 */
export function AccountsSection({ accounts, isLoading }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const syncMutation = useMutation({
    mutationFn: syncExchangeAccount,
    onSuccess: () => {
      // The sync may have brought new positions/fills along with the account status.
      queryClient.invalidateQueries({ queryKey: investingKeys.all })
      notifications.show({ color: "green", message: t("investments.acc_sync_success") })
    },
    onError: (err) => {
      notifications.show({ color: "red", message: err.message })
    },
  })

  const openConnect = () =>
    open({
      centered: true,
      title: t("investments.acc_connect_title"),
      children: <ConnectAccountForm onDone={close} onCancel={close} />,
    })

  const openDelete = (account: ExchangeAccount) =>
    open({
      centered: true,
      title: t("investments.acc_delete_title"),
      children: <DeleteAccountConfirm account={account} />,
    })

  const openRename = (account: ExchangeAccount) =>
    open({
      centered: true,
      title: t("investments.acc_rename_title"),
      children: <RenameAccountForm account={account} />,
    })

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    )
  }

  // Onboarding: no accounts yet — explain the read-only key and show the form inline.
  if (accounts.length === 0) {
    return (
      <Paper p="lg">
        <Stack gap="md" maw={480} mx="auto" py="md">
          <Stack align="center" gap="sm">
            <ThemeIcon variant="light" color="lime" size={56} radius="xl">
              <IconPlugConnected size={28} />
            </ThemeIcon>
            <Text fw={600}>{t("investments.acc_onboarding_title")}</Text>
            <Text size="sm" c="dimmed" ta="center">
              {t("investments.acc_onboarding_text")}
            </Text>
          </Stack>
          <ConnectAccountForm />
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text fw={600} size="sm">
          {t("investments.acc_title")}
        </Text>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openConnect}>
          {t("investments.acc_add")}
        </Button>
      </Group>

      {accounts.map((account, i) => {
        const statusLabel =
          account.status === "ERROR" ? (
            <Tooltip
              label={account.lastError ?? t("investments.acc_status_error")}
              multiline
              maw={320}
            >
              <Text size="xs" c="red.5" style={{ cursor: "help" }}>
                {t("investments.acc_status_error")}
              </Text>
            </Tooltip>
          ) : account.lastSyncAt === null ? (
            <Group gap={6}>
              <Loader size={12} />
              <Text size="xs" c="dimmed">
                {t("investments.acc_first_sync")}
              </Text>
            </Group>
          ) : (
            <Text size="xs" c="dimmed">
              {t("investments.acc_synced_at", {
                date: format(account.lastSyncAt, "d MMM yyyy HH:mm", { locale }),
              })}
            </Text>
          )

        return (
          <Group
            key={account.id}
            px="md"
            py="sm"
            wrap="nowrap"
            gap="sm"
            style={{
              borderBottom:
                i < accounts.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none",
            }}
          >
            <Box
              w={10}
              h={10}
              style={{ borderRadius: 999, background: STATUS_COLOR[account.status], flexShrink: 0 }}
            />
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs">
                <Text size="sm" fw={500} truncate="end">
                  {account.label}
                </Text>
                <Badge variant="light" color="gray" size="xs" tt="none">
                  {account.exchange}
                </Badge>
                {account.apiKeyMasked && (
                  <Text ff="monospace" size="xs" c="dimmed">
                    {account.apiKeyMasked}
                  </Text>
                )}
              </Group>
              <Group gap="xs">
                {statusLabel}
                <Text size="xs" c="dimmed">
                  ·{" "}
                  {t("investments.acc_sync_from", {
                    date: format(account.syncFrom, "d MMM yyyy", { locale }),
                  })}
                </Text>
              </Group>
            </Stack>
            <Tooltip label={t("common.change")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t("common.change")}
                onClick={() => openRename(account)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("investments.acc_sync_now")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t("investments.acc_sync_now")}
                loading={syncMutation.isPending && syncMutation.variables === account.id}
                onClick={() => syncMutation.mutate(account.id)}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("common.delete")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t("common.delete")}
                onClick={() => openDelete(account)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )
      })}
    </Paper>
  )
}
