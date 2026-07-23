import { createPositionNote, deletePositionNote, updatePositionNote } from "@api/investing"
import type { Position } from "@appTypes/investing"
import { positionDirection } from "@appTypes/investing"
import { CategoryBadge } from "@components/investments/CategoryBadge"
import { formatUsd } from "@components/investments/format"
import { investingKeys } from "@constants/queries/investing"
import { dateFnsLocales } from "@i18n/languages.ts"
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconCheck, IconEdit, IconTrash, IconX } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  position: Position
}

/**
 * Notes on a trade — the "why", independent of source (bybit or manual) and status (open or
 * closed), unlike edit/delete which stay restricted to manual entries. Editing/deleting a note
 * is immediate (no confirm step), same as the goals' ContributionsHistory list.
 */
export function PositionNotes({ position }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const queryClient = useQueryClient()

  const [body, setBody] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  // A note's imageUrl is a free-form link, not guaranteed to actually be an image — fall back
  // to a plain "open link" for whichever notes fail to load as a thumbnail.
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  // The thumbnail is invisible (not just missing) until it loads — a spinner in its place
  // makes that wait legible instead of looking like nothing's there.
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // The notes list lives on the position itself — refetching the journal page is the
  // simplest way to keep it in sync, same as manual position create/edit/delete.
  const invalidate = () => queryClient.invalidateQueries({ queryKey: investingKeys.allPositions })

  const create = useMutation({
    mutationFn: () =>
      createPositionNote(position.id, {
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate()
      setBody("")
      setImageUrl("")
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const update = useMutation({
    mutationFn: (noteId: string) =>
      updatePositionNote(position.id, noteId, { body: editBody.trim() }),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const remove = useMutation({
    mutationFn: (noteId: string) => deletePositionNote(position.id, noteId),
    onSuccess: invalidate,
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    create.mutate()
  }

  const long = positionDirection(position) === "long"

  return (
    <>
      <Stack gap="md">
        {/* Which trade this is — the modal only carries the symbol in its title, and with
          several positions on the same pair (scale-ins, re-entries) that alone doesn't
          say which one you're annotating. */}
        <Paper withBorder p="sm" bg="var(--mantine-color-default)">
          <Group gap={6} mb={4}>
            <Badge variant="light" color={long ? "green" : "red"} size="sm">
              {t(long ? "investments.pos_long" : "investments.pos_short")}
            </Badge>
            <CategoryBadge category={position.category} />
            {position.status === "OPEN" && (
              <Badge variant="light" color="green" size="sm">
                {t("investments.pos_status_open")}
              </Badge>
            )}
          </Group>
          <Text size="sm" ff="monospace">
            {formatUsd(position.avgEntryPrice, i18n.language)} →{" "}
            {position.avgExitPrice == null
              ? t("investments.pos_in_trade")
              : formatUsd(position.avgExitPrice, i18n.language)}
          </Text>
          <Text size="xs" c="dimmed">
            {position.openedAt ? format(position.openedAt, "d MMM yyyy", { locale }) : "—"}
            {" → "}
            {position.closedAt
              ? format(position.closedAt, "d MMM yyyy", { locale })
              : t("investments.pos_in_trade")}
            {" · "}
            {formatUsd(position.entryVolumeUsd, i18n.language)}
          </Text>
        </Paper>

        {position.notes.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("investments.note_empty")}
          </Text>
        ) : (
          <ScrollArea.Autosize mah={320}>
            <Stack gap="xs">
              {position.notes.map((n) => (
                <Paper key={n.id} withBorder p="sm" bg="var(--mantine-color-default)">
                  {editingId === n.id ? (
                    <Stack gap="xs">
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.currentTarget.value)}
                        autosize
                        minRows={2}
                        maxLength={2000}
                        autoFocus
                      />
                      <Group justify="flex-end" gap={4}>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label={t("common.cancel")}
                          onClick={() => setEditingId(null)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="green"
                          aria-label={t("common.save")}
                          loading={update.isPending}
                          disabled={!editBody.trim()}
                          onClick={() => update.mutate(n.id)}
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  ) : (
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Stack gap={4} style={{ minWidth: 0 }}>
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                          {n.body}
                        </Text>
                        {n.imageUrl &&
                          (brokenImages.has(n.id) ? (
                            <Anchor
                              href={n.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="xs"
                            >
                              {t("investments.note_image_link")}
                            </Anchor>
                          ) : (
                            <Box pos="relative" w={64} h={64}>
                              {!loadedImages.has(n.id) && (
                                <Center pos="absolute" top={0} left={0} right={0} bottom={0}>
                                  <Loader size="xs" />
                                </Center>
                              )}
                              <Image
                                src={n.imageUrl}
                                alt={t("investments.note_image_link")}
                                w={64}
                                h={64}
                                fit="cover"
                                radius="sm"
                                style={{
                                  cursor: "pointer",
                                  opacity: loadedImages.has(n.id) ? 1 : 0,
                                  transition: "opacity .15s",
                                }}
                                onClick={() => setLightboxUrl(n.imageUrl)}
                                onLoad={() => setLoadedImages((prev) => new Set(prev).add(n.id))}
                                onError={() => setBrokenImages((prev) => new Set(prev).add(n.id))}
                              />
                            </Box>
                          ))}
                        <Text size="xs" c="dimmed">
                          {format(n.createdAt, "d MMM yyyy HH:mm", { locale })}
                        </Text>
                      </Stack>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color="gray"
                          aria-label={t("common.change")}
                          onClick={() => {
                            setEditingId(n.id)
                            setEditBody(n.body)
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color="red"
                          aria-label={t("common.delete")}
                          loading={remove.isPending && remove.variables === n.id}
                          onClick={() => remove.mutate(n.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  )}
                </Paper>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}

        <form onSubmit={submit}>
          <Stack gap="xs">
            <Textarea
              label={t("investments.note_add_label")}
              placeholder={t("investments.note_add_placeholder")}
              value={body}
              onChange={(e) => setBody(e.currentTarget.value)}
              autosize
              minRows={2}
              maxLength={2000}
            />
            <TextInput
              label={t("investments.note_image_label")}
              placeholder="https://…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button type="submit" loading={create.isPending} disabled={!body.trim()}>
                {t("investments.note_add")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>

      <Modal
        opened={lightboxUrl != null}
        onClose={() => setLightboxUrl(null)}
        size="auto"
        centered
        padding={0}
        withCloseButton
      >
        {lightboxUrl && <Image src={lightboxUrl} alt="" fit="contain" mah="80vh" />}
      </Modal>
    </>
  )
}
