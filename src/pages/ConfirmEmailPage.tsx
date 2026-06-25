import { ApiError } from "@api/apiError"
import { confirmEmail, getMe, resendEmailConfirmation } from "@api/auth"
import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Center, Loader, Paper, Stack, Text, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { IconCircleCheck } from "@tabler/icons-react"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"

type Status = "no-token" | "loading" | "success" | "error" | "already"

/**
 * Landing page for the link from the confirmation email
 * ({FRONTEND_URL}/confirm-email?token=...). Reads the token from the query, calls
 * POST /auth/confirm-email and reports the result. Serves both flows: email/password
 * registration (`emailVerified`) and Telegram→email linking (`pendingEmail`). If the user is
 * logged in, refreshes the profile so the relevant banner clears. Accessible to guests too.
 *
 * Outcomes: 200 → confirmed; 409 → already confirmed/linked elsewhere (offer the dashboard);
 * 400/other → invalid or expired (offer to resend, for logged-in users).
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

    // refresh the logged-in profile so the email banner reflects the new state
    const refreshMe = async () => {
      if (!useAuthStore.getState().user) return
      const me = await getMe().catch(() => null)
      if (me) setUser(me)
    }

    confirmEmail(token)
      .then(async () => {
        await refreshMe()
        setStatus("success")
      })
      .catch(async (err) => {
        // 409 — the email is already confirmed (or the link belongs to a different account);
        // treat it as a soft success and send the user onward. Anything else (400/expired) is a
        // real failure that a resend can fix.
        if (err instanceof ApiError && err.status === 409) {
          await refreshMe()
          setStatus("already")
        } else {
          setStatus("error")
        }
      })
  }, [token, setUser])

  const resendMutation = useMutation({
    mutationFn: resendEmailConfirmation,
    onSuccess: () => notifications.show({ color: "green", message: t("settings.email_resent") }),
    onError: () => notifications.show({ color: "red", message: t("settings.error") }),
  })

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

          {(status === "success" || status === "already") && (
            <>
              <IconCircleCheck size={48} color="var(--mantine-color-lime-6)" />
              <Text ta="center">
                {status === "success" ? t("confirmEmail.success") : t("confirmEmail.already")}
              </Text>
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

          {/* On an expired/invalid link a logged-in user can request a fresh one right here */}
          {status === "error" && user && (
            <Button
              fullWidth
              variant="default"
              loading={resendMutation.isPending}
              disabled={resendMutation.isSuccess}
              onClick={() => resendMutation.mutate()}
            >
              {t("settings.email_resend")}
            </Button>
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
