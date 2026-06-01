import { SimpleGrid, Skeleton } from "@mantine/core"
import { KpiCard } from "@ui/KpiCard"

export interface Kpi {
  /** Стабильный ключ для списка. */
  key: string
  label: string
  value: string
  sub?: string
  trend?: number
  accent?: string
  /** Показывает скелетон вместо карточки, пока грузятся данные. */
  loading?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}

interface Props {
  /** Метрики верхнего ряда дашборда. */
  kpis: Kpi[]
}

/** Ряд KPI-карточек главной страницы. Чисто презентационный — данные приходят пропсом. */
export function HomeKpis({ kpis }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {kpis.map(({ key, loading, ...card }) => (
        <Skeleton key={key} visible={loading ?? false} radius="md">
          <KpiCard {...card} />
        </Skeleton>
      ))}
    </SimpleGrid>
  )
}
