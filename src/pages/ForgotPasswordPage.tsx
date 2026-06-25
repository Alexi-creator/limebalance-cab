import { forgotPassword } from "@api/auth"
import { RouteNames } from "@constants/routeNames"
import { zodResolver } from "@hookform/resolvers/zod"
import { Anchor, Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core"
import { IconMailFast } from "@tabler/icons-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { z } from "zod"

/**
 * "Forgot password" screen ({@link RouteNames.ForgotPassword}). Collects an email and calls
 * POST /auth/forgot-password. The backend always answers { success: true } to avoid leaking
 * which addresses are registered, so on success we only show a neutral confirmation — never a
 * "found / not found" distinction. Reachable from the email login form.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation()

  const schema = z.object({
    email: z.email(t("forgotPassword.email_error")),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const [isPending, setIsPending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async ({ email }: FormValues) => {
    setIsPending(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError("email", { message: (err as Error).message })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Stack align="center" justify="center" mih="calc(100vh - 60px)" px="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={400} radius="md">
        <Stack>
          <Title order={2} ta="center">
            {t("forgotPassword.title")}
          </Title>

          {sent ? (
            <Stack align="center">
              <IconMailFast size={48} color="var(--mantine-color-lime-6)" />
              <Text ta="center">{t("forgotPassword.sent")}</Text>
              <Button component={Link} to={RouteNames.Auth} fullWidth>
                {t("forgotPassword.back_to_login")}
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack>
                <Text size="sm" c="dimmed">
                  {t("forgotPassword.subtitle")}
                </Text>

                <TextInput
                  label={t("forgotPassword.email_label")}
                  placeholder={t("forgotPassword.email_placeholder")}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Button type="submit" loading={isPending}>
                  {t("forgotPassword.submit")}
                </Button>

                <Anchor component={Link} to={RouteNames.Auth} size="sm" ta="center">
                  {t("forgotPassword.back_to_login")}
                </Anchor>
              </Stack>
            </form>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
