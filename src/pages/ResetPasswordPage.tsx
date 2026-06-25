import { ApiError } from "@api/apiError"
import { resetPassword } from "@api/auth"
import { HttpStatus } from "@constants/httpStatus"
import { RouteNames } from "@constants/routeNames"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Anchor, Button, Paper, PasswordInput, Stack, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { z } from "zod"

/**
 * Landing page for the reset link from the email ({FRONTEND_URL}/reset-password?token=...).
 * Reads the one-time UUID token from the query and calls POST /auth/reset-password with the new
 * password. The token lives for 15 minutes; a 400 means it is invalid, already used, or expired —
 * we then surface a CTA to request a fresh link. On success we redirect to the login screen with a
 * toast. Reachable by guests and authenticated users alike (it lives outside the route guards).
 */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get("token")

  const schema = z
    .object({
      password: z.string().min(8, t("resetPassword.password_error")),
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t("resetPassword.confirm_error"),
      path: ["passwordConfirm"],
    })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const [isPending, setIsPending] = useState(false)
  // set when the backend rejects the token (invalid / used / expired) — swaps the form for a CTA
  const [tokenError, setTokenError] = useState(false)

  const onSubmit = async ({ password }: FormValues) => {
    if (!token) return
    setIsPending(true)
    try {
      await resetPassword({ token, password })
      notifications.show({ color: "green", message: t("resetPassword.success") })
      navigate(RouteNames.Auth)
    } catch (err) {
      // With the password pre-validated on the client, a 400 here means the token is no good.
      if (err instanceof ApiError && err.status === HttpStatus.BAD_REQUEST) {
        setTokenError(true)
      } else {
        notifications.show({ color: "red", message: (err as Error).message })
      }
    } finally {
      setIsPending(false)
    }
  }

  const invalidLink = !token || tokenError

  return (
    <Stack align="center" justify="center" mih="calc(100vh - 60px)" px="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={400} radius="md">
        <Stack>
          <Title order={2} ta="center">
            {t("resetPassword.title")}
          </Title>

          {invalidLink ? (
            <Stack>
              <Alert color="red" variant="light">
                {token ? t("resetPassword.token_error") : t("resetPassword.no_token")}
              </Alert>
              <Button component={Link} to={RouteNames.ForgotPassword} fullWidth>
                {t("resetPassword.request_new")}
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack>
                <PasswordInput
                  label={t("resetPassword.password_label")}
                  placeholder={t("resetPassword.password_placeholder")}
                  error={errors.password?.message}
                  {...register("password")}
                />

                <PasswordInput
                  label={t("resetPassword.confirm_label")}
                  placeholder={t("resetPassword.confirm_placeholder")}
                  error={errors.passwordConfirm?.message}
                  {...register("passwordConfirm")}
                />

                <Button type="submit" loading={isPending}>
                  {t("resetPassword.submit")}
                </Button>
              </Stack>
            </form>
          )}

          <Anchor component={Link} to={RouteNames.Auth} size="sm" ta="center">
            {t("resetPassword.back_to_login")}
          </Anchor>
        </Stack>
      </Paper>
    </Stack>
  )
}
