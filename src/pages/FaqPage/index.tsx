import {
  Accordion,
  Badge,
  Button,
  CloseButton,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core"
import { IconArrowRight, IconSearch } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { FAQ_SECTIONS } from "./config"

/**
 * Help page: how to use the app, what each section is for, how the sections add up to the balance,
 * and answers to the common questions. Everything is text from `faq.*`, so the search matches
 * whatever language the user reads it in.
 */
export function FaqPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const needle = query.trim().toLowerCase()
  const matches = (id: string) =>
    !needle || `${t(`faq.items.${id}.q`)} ${t(`faq.items.${id}.a`)}`.toLowerCase().includes(needle)

  const sections = FAQ_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => matches(item.id)),
  })).filter((section) => section.items.length > 0)

  return (
    <Stack gap="md" maw={880}>
      <Stack gap={4}>
        <Title order={2} size="h3">
          {t("faq.title")}
        </Title>
        <Text size="sm" c="dimmed">
          {t("faq.subtitle")}
        </Text>
      </Stack>

      <TextInput
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        placeholder={t("faq.search_placeholder")}
        leftSection={<IconSearch size={16} />}
        rightSection={
          query ? (
            <CloseButton
              size="sm"
              aria-label={t("transactions.clear_search")}
              onClick={() => setQuery("")}
            />
          ) : null
        }
      />

      {sections.length === 0 && (
        <Paper p="xl">
          <Text size="sm" c="dimmed" ta="center">
            {t("faq.search_empty")}
          </Text>
        </Paper>
      )}

      {sections.map((section) => {
        const SectionIcon = section.icon
        return (
          <Stack key={section.id} gap="xs">
            <Group gap="xs" mt="sm">
              <ThemeIcon variant="light" color="lime" size={28} radius="md">
                <SectionIcon size={16} />
              </ThemeIcon>
              <Title order={3} size="h5">
                {t(`faq.sections.${section.id}`)}
              </Title>
            </Group>

            {section.id === "balance" && !needle && <BalanceFormula />}

            <Paper p={0} style={{ overflow: "hidden" }}>
              <Accordion multiple variant="default" chevronPosition="right">
                {section.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <Accordion.Item key={item.id} value={item.id}>
                      <Accordion.Control
                        icon={
                          ItemIcon ? (
                            <ItemIcon size={18} color="var(--mantine-color-lime-5)" />
                          ) : undefined
                        }
                      >
                        <Text size="sm" fw={500}>
                          {t(`faq.items.${item.id}.q`)}
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        {/* Answers are plain text; paragraphs and bullets come as line breaks. */}
                        <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-line" }}>
                          {t(`faq.items.${item.id}.a`)}
                        </Text>
                        {item.to && (
                          <Button
                            mt="sm"
                            size="xs"
                            variant="light"
                            rightSection={<IconArrowRight size={14} />}
                            onClick={() => navigate(item.to as string)}
                          >
                            {t("faq.open_page")}
                          </Button>
                        )}
                      </Accordion.Panel>
                    </Accordion.Item>
                  )
                })}
              </Accordion>
            </Paper>
          </Stack>
        )
      })}
    </Stack>
  )
}

/**
 * The balance as one line of arithmetic — the thing the whole "how it adds up" section explains.
 * Exchanges are left out of it on purpose and said so underneath: they move money, not add it.
 */
function BalanceFormula() {
  const { t } = useTranslation()
  const op = (sign: string) => (
    <Text ff="monospace" c="dimmed" fw={500}>
      {sign}
    </Text>
  )

  return (
    <Paper p="md">
      <Group gap="xs" wrap="wrap">
        <Badge size="lg" variant="light" color="lime" tt="none">
          {t("faq.formula.balance")}
        </Badge>
        {op("=")}
        <Badge size="lg" variant="light" color="green" tt="none">
          {t("faq.formula.income")}
        </Badge>
        {op("−")}
        <Badge size="lg" variant="light" color="red" tt="none">
          {t("faq.formula.expense")}
        </Badge>
        {op("−")}
        <Badge size="lg" variant="light" color="yellow" tt="none">
          {t("faq.formula.goals")}
        </Badge>
        {op("−")}
        <Badge size="lg" variant="light" color="blue" tt="none">
          {t("faq.formula.venues")}
        </Badge>
      </Group>
      <Text size="xs" c="dimmed" mt="sm">
        {t("faq.formula.note")}
      </Text>
    </Paper>
  )
}
