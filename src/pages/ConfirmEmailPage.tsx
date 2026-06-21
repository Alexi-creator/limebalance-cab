import { confirmEmail, getMe } from "@api/auth"
import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Center, Loader, Paper, Stack, Text, Title } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconCircleCheck } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"

type Status = "no-token" | "loading" | "success" | "error"

/**
 * Landing page for the link from the confirmation email
 * ({FRONTEND_URL}/confirm-email?token=...). Reads the token from the query, calls
 * POST /auth/confirm-email and reports the result. If the user is logged in, refreshes
 * the profile so `email`/`pendingEmail` update. Accessible to both guests and authed users.
 */
export function ConfirmEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get("token")
  // reactive — drives which "next" button to show
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [status, setStatus] = useState<Status>(token ? "loading" : "no-token")
  // guard against the dev StrictMode double-invoke consuming the one-time token twice
  const firedRef = useRef(false)

  useEffect(() => {
    if (!token || firedRef.current) return
    firedRef.current = true

    confirmEmail(token)
      .then(async () => {
        // refresh the profile for a logged-in user so the new email is reflected
        if (useAuthStore.getState().user) {
          const me = await getMe().catch(() => null)
          if (me) setUser(me)
        }
        setStatus("success")
      })
      .catch(() => setStatus("error"))
  }, [token, setUser])

  return (
    <Stack align="center" justify="center" mih="calc(100vh - 60px)" px="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={400} radius="md">
        <Stack align="center">
          <Title order={2} ta="center">
            {t("confirmEmail.title")}
          </Title>

          {status === "loading" && (
            <Center py="md">
              <Loader />
            </Center>
          )}

          {status === "success" && (
            <>
              <IconCircleCheck size={48} color="var(--mantine-color-lime-6)" />
              <Text ta="center">{t("confirmEmail.success")}</Text>
            </>
          )}

          {status === "error" && (
            <Alert color="red" variant="light" w="100%">
              {t("confirmEmail.error")}
            </Alert>
          )}

          {status === "no-token" && (
            <Alert color="red" variant="light" w="100%">
              {t("confirmEmail.invalid")}
            </Alert>
          )}

          {status !== "loading" && (
            <Button component={Link} to={user ? RouteNames.Settings : RouteNames.Auth} fullWidth>
              {user ? t("confirmEmail.go_settings") : t("confirmEmail.go_login")}
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
