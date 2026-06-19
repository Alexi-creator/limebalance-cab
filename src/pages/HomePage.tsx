import { CashflowChart } from "@components/CashflowChart"
import { GoalsSnippet } from "@components/GoalsSnippet"
import { HomeHeader } from "@components/homePage/HomeHeader"
import { HomeKpis } from "@components/homePage/HomeKpis"
// TODO(investments): temporarily hidden, page under development — restore the import and widget below
// import { PortfolioSnippet } from "@components/PortfolioSnippet"
import { RecentTransactions } from "@components/RecentTransactions"
import { Grid, Stack } from "@mantine/core"

export function HomePage() {
  return (
    <Stack gap="md">
      <HomeHeader />

      <HomeKpis />

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <CashflowChart />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <GoalsSnippet />
            {/* TODO(investments): temporarily hidden, page under development — restore the widget */}
            {/* <PortfolioSnippet /> */}
          </Stack>
        </Grid.Col>
      </Grid>

      <RecentTransactions />
    </Stack>
  )
}
