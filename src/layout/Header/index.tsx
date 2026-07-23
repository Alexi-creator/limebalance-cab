import { AddModal } from "@components/AddModal"
import { LangSwitcher } from "@components/LangSwitcher"
import { NotificationsMenu } from "@components/NotificationsMenu"
import { ThemeToggle } from "@components/ThemeToggle"
import { AppShell, Box, Burger, Group } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { useSidebarStore } from "@store/sidebarStore"
import { IconPlus } from "@tabler/icons-react"
import { SelectButton } from "@ui/SelectButton"
import { useTranslation } from "react-i18next"
import classes from "./classes.module.css"
import { getAddOptions } from "./config"

/**
 * Top app bar (AppShell.Header).
 * Contains the burger for the mobile menu, the language/theme toggle,
 * the notifications bell, and the "Add" button with a dropdown of record types.
 * Reads the mobile menu state from `sidebarStore`. Takes no props.
 */
export function Header() {
  const { t } = useTranslation()
  const { open } = useModalStore()
  const opened = useSidebarStore((s) => s.opened)
  const toggle = useSidebarStore((s) => s.toggle)

  return (
    <AppShell.Header className={classes.root}>
      <Group h="100%" px="md" gap="md" wrap="nowrap">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" data-tour="nav-burger" />

        <Group gap="xs" ml="auto" wrap="nowrap">
          <Box visibleFrom="sm">
            <LangSwitcher />
          </Box>

          <Box visibleFrom="sm">
            <NotificationsMenu />
          </Box>

          <Box visibleFrom="sm">
            <ThemeToggle />
          </Box>

          <Box data-tour="add-button">
            <SelectButton
              label={t("header.add")}
              icon={<IconPlus size={14} />}
              onClick={() =>
                open({ size: "lg", centered: true, children: <AddModal type="transaction" /> })
              }
              options={getAddOptions(t)}
              menuWidth={260}
            />
          </Box>
        </Group>
      </Group>
    </AppShell.Header>
  )
}
