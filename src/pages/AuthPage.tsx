import { ApiError } from "@api/apiError"
import { login, loginTelegram } from "@api/auth"
import { HttpStatus } from "@constants/httpStatus"
import { RouteNames } from "@constants/routeNames"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Alert,
  Anchor,
  Box,
  Button,
  Divider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconBrandGoogle, IconBrandTelegram, IconMail } from "@tabler/icons-react"
import type { TelegramAuthData } from "@telegram-auth/react"
import { LoginButton } from "@telegram-auth/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string

type AuthMethod = "select" | "email"

function EmailForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const authSchema = z.object({
    email: z.email(t("auth.email_error")),
    password: z.string().min(6, t("auth.password_error")),
  })

  type AuthFormValues = z.infer<typeof authSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  })

  const [isPending, setIsPending] = useState(false)

  const onSubmit = async (data: AuthFormValues) => {
    setIsPending(true)
    try {
      const user = await login(data)
      setUser(user)
      navigate(RouteNames.Home)
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === HttpStatus.UNAUTHORIZED
          ? t("auth.invalid_credentials")
          : (err as Error).message
      setError("root", { message })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label={t("auth.email_label")}
          placeholder={t("auth.email_placeholder")}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label={t("auth.password_label")}
          placeholder={t("auth.password_placeholder")}
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <Text c="red" size="sm">
            {errors.root.message}
          </Text>
        )}

        <Button type="submit" loading={isPending}>
          {t("auth.submit")}
        </Button>

        <Anchor component="button" type="button" size="sm" ta="center" onClick={onBack}>
          {t("auth.back")}
        </Anchor>
      </Stack>
    </form>
  )
}

export function AuthPage() {
  const { t } = useTranslation()
  const [method, setMethod] = useState<AuthMethod>("select")
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const handleTelegramAuth = async (data: TelegramAuthData) => {
    try {
      const user = await loginTelegram(data)
      setUser(user)
      navigate(RouteNames.Home)
    } catch {
      // stay on page
    }
  }

  return (
    <Stack align="center" justify="center" mih="calc(100vh - 60px)" px="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={400} radius="md">
        <Stack>
          <Title order={2} ta="center">
            {t("auth.title")}
          </Title>

          {method === "select" && (
            <Stack>
              <Alert variant="light" color="blue" icon={<IconBrandTelegram size={16} />}>
                <Stack gap="sm">
                  <Text size="sm">{t("auth.telegram_hint")}</Text>
                  <Box style={{ display: "flex", justifyContent: "center" }}>
                    <LoginButton
                      botUsername={BOT_USERNAME}
                      onAuthCallback={handleTelegramAuth}
                      buttonSize="large"
                      cornerRadius={8}
                      showAvatar
                    />
                  </Box>
                </Stack>
              </Alert>

              <Button
                variant="default"
                fullWidth
                leftSection={<IconBrandGoogle size={18} />}
                onClick={() => console.log("google")}
              >
                {t("auth.sign_in_google")}
              </Button>

              <Divider label={t("auth.or")} labelPosition="center" />

              <Button
                variant="light"
                fullWidth
                leftSection={<IconMail size={18} />}
                onClick={() => setMethod("email")}
              >
                {t("auth.sign_in_email")}
              </Button>
            </Stack>
          )}

          {method === "email" && <EmailForm onBack={() => setMethod("select")} />}

          <Text size="xs" c="dimmed" ta="center">
            {t("auth.terms")}
          </Text>

          <Text size="sm" ta="center">
            {t("auth.no_account")}{" "}
            <Anchor component={Link} to={RouteNames.Register}>
              {t("auth.register_link")}
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
