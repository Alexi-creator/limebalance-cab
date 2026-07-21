import { ApiError } from "@api/apiError"
import { getExchangeAccounts } from "@api/investing"
import { AccountsSection } from "@components/investments/AccountsSection"
import { HoldingsSection } from "@components/investments/HoldingsSection"
import { InvestingPaywall } from "@components/investments/Paywall"
import { PositionsSection } from "@components/investments/PositionsSection"
import { HttpStatus } from "@constants/httpStatus"
import { ACCOUNTS_FIRST_SYNC_POLL_MS, investingKeys } from "@constants/queries/investing"
import { RouteNames } from "@constants/routeNames"
import { Alert, Box, Stack, Tabs, Text, Title } from "@mantine/core"
import { IconBriefcase, IconNotebook, IconPlugConnected } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

const TAB_VALUES = ["journal", "portfolio", "accounts"]

/**
 * Investments section: exchange (Bybit) accounts, the trade journal and the
 * portfolio. Pro/Ultra only — the backend answers 403 on every /investing/*
 * route for the free plan, which turns the whole page into a paywall.
 */
export function InvestmentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tab: tabParam } = useParams<{ tab?: string }>()

  // Only a known value pins a tab; missing/unknown falls through to the accounts-vs-journal
  // default below (depends on data that isn't known from the URL). Single route with an
  // optional :tab param — switching tabs updates the param without unmounting the page.
  const tab = TAB_VALUES.includes(tabParam ?? "") ? (tabParam as string) : null

  const {
    data: accounts,
    isLoading,
    error,
  } = useQuery({
    queryKey: investingKeys.accounts,
    queryFn: getExchangeAccounts,
    // 403 is a plan gate, not a flake — retrying it only delays the paywall.
    retry: (failureCount, err) =>
      !(err instanceof ApiError && err.status === HttpStatus.FORBIDDEN) && failureCount < 2,
    // The backend pulls exchange history in the background (cron every 2 min);
    // while some account hasn't finished its first sync, poll for the status.
    refetchInterval: (query) =>
      query.state.data?.some((a) => a.lastSyncAt === null) ? ACCOUNTS_FIRST_SYNC_POLL_MS : false,
  })

  const isPaywalled = error instanceof ApiError && error.status === HttpStatus.FORBIDDEN

  // A fresh user lands on the exchange onboarding; anyone with data — on the journal.
  const activeTab = tab ?? (!isLoading && accounts?.length === 0 ? "accounts" : "journal")
  const setTab = (value: string | null) =>
    value && navigate(`${RouteNames.Investments}/${value}`, { replace: true })

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2} size="h3">
          {t("investments.title")}
        </Title>
        <Text size="sm" c="dimmed">
          {t("investments.subtitle")}
        </Text>
      </Stack>

      {isPaywalled ? (
        <InvestingPaywall />
      ) : error ? (
        <Alert color="red">{error.message}</Alert>
      ) : (
        <Tabs value={activeTab} onChange={setTab} keepMounted={false}>
          <Tabs.List mb="md">
            <Tabs.Tab value="journal" leftSection={<IconNotebook size={16} />}>
              <Box component="span" visibleFrom="sm">
                {t("investments.tab_journal")}
              </Box>
            </Tabs.Tab>
            <Tabs.Tab value="portfolio" leftSection={<IconBriefcase size={16} />}>
              <Box component="span" visibleFrom="sm">
                {t("investments.tab_portfolio")}
              </Box>
            </Tabs.Tab>
            <Tabs.Tab value="accounts" leftSection={<IconPlugConnected size={16} />}>
              <Box component="span" visibleFrom="sm">
                {t("investments.tab_accounts")}
              </Box>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="journal">
            <PositionsSection accounts={accounts ?? []} />
          </Tabs.Panel>
          <Tabs.Panel value="portfolio">
            <HoldingsSection />
          </Tabs.Panel>
          <Tabs.Panel value="accounts">
            <AccountsSection accounts={accounts ?? []} isLoading={isLoading} />
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  )
}
