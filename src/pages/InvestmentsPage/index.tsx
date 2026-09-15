import { Alert, Box, Group, Stack, Tabs, Text, Title } from "@mantine/core"
import { IconArrowsUpDown, IconNotebook, IconPlugConnected } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useExchangeAccounts } from "@/modules/investments/api/useExchangeAccounts"
import { useInvestmentsTour } from "@/modules/investments/hooks/useInvestmentsTour"
import {
  AccountsSection,
  InvestingPaywall,
  PositionsSection,
  VenuesBlock,
} from "@/modules/investments/ui"
import { ApiError } from "@/shared/api/apiError"
import { HttpStatus } from "@/shared/api/httpStatus"
import { RouteNames } from "@/shared/config/routeNames"
import { TourTriggerButton } from "@/shared/ui/TourTriggerButton"

const TAB_VALUES = ["journal", "portfolio", "accounts"]

/**
 * Investments section: exchange (Bybit) accounts, the trade journal and the
 * portfolio. Pro/Ultra only — the backend answers 403 on every /investing/*
 * route for the free plan, which turns the whole page into a paywall.
 */
export function InvestmentsPage() {
  const { t } = useTranslation()
  const { startTour } = useInvestmentsTour()
  const navigate = useNavigate()
  const { tab: tabParam } = useParams<{ tab?: string }>()

  // Only a known value pins a tab; missing/unknown falls through to the accounts-vs-journal
  // default below (depends on data that isn't known from the URL). Single route with an
  // optional :tab param — switching tabs updates the param without unmounting the page.
  const tab = TAB_VALUES.includes(tabParam ?? "") ? (tabParam as string) : null

  const { data: accounts, isLoading, error } = useExchangeAccounts()

  const isPaywalled = error instanceof ApiError && error.status === HttpStatus.FORBIDDEN

  // A fresh user lands on the exchange onboarding; anyone with data — on the journal.
  const activeTab = tab ?? (!isLoading && accounts?.length === 0 ? "accounts" : "journal")
  const setTab = (value: string | null) =>
    value && navigate(`${RouteNames.Investments}/${value}`, { replace: true })

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("investments.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("investments.subtitle")}
          </Text>
        </Stack>
        {!isPaywalled && <TourTriggerButton onClick={startTour} />}
      </Group>

      {isPaywalled ? (
        <InvestingPaywall />
      ) : error ? (
        <Alert color="red">{error.message}</Alert>
      ) : (
        <Tabs value={activeTab} onChange={setTab} keepMounted={false}>
          <Tabs.List mb="md" data-tour="inv-tabs">
            <Tabs.Tab
              value="journal"
              leftSection={<IconNotebook size={16} />}
              data-tour="inv-tab-journal"
            >
              <Box component="span" visibleFrom="sm">
                {t("investments.tab_journal")}
              </Box>
            </Tabs.Tab>
            <Tabs.Tab
              value="portfolio"
              leftSection={<IconArrowsUpDown size={16} />}
              data-tour="inv-tab-portfolio"
            >
              <Box component="span" visibleFrom="sm">
                {t("investments.tab_portfolio")}
              </Box>
            </Tabs.Tab>
            <Tabs.Tab
              value="accounts"
              leftSection={<IconPlugConnected size={16} />}
              data-tour="inv-tab-accounts"
            >
              <Box component="span" visibleFrom="sm">
                {t("investments.tab_accounts")}
              </Box>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="journal" data-tour="inv-journal">
            <PositionsSection accounts={accounts ?? []} />
          </Tabs.Panel>
          <Tabs.Panel value="portfolio" data-tour="inv-portfolio">
            <VenuesBlock />
          </Tabs.Panel>
          <Tabs.Panel value="accounts" data-tour="inv-accounts">
            <AccountsSection accounts={accounts ?? []} isLoading={isLoading} />
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  )
}
