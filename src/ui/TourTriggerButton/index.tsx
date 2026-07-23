import { ActionIcon, Tooltip } from "@mantine/core"
import { IconHelpCircle } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

interface TourTriggerButtonProps {
  onClick: () => void
}

/**
 * The "?" button that (re)starts a page's guided tour. Identical everywhere it's used,
 * including the `data-tour="tour-trigger"` marker — `useTour`'s first-visit hint and
 * every page tour target this exact selector.
 */
export function TourTriggerButton({ onClick }: TourTriggerButtonProps) {
  const { t } = useTranslation()
  return (
    <Tooltip label={t("tour.start")}>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={onClick}
        aria-label={t("tour.start")}
        data-tour="tour-trigger"
      >
        <IconHelpCircle size={20} />
      </ActionIcon>
    </Tooltip>
  )
}
