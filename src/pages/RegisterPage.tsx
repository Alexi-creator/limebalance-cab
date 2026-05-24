import { ApiError } from "@api/apiError"
import { loginTelegram, register } from "@api/auth"
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

  const registerSchema = z
    .object({
      email: z.email(t("register.email_error")),
      password: z.string().min(6, t("register.password_error")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("register.confirm_password_error"),
      path: ["confirmPassword"],
    })

  type RegisterFormValues = z.infer<typeof registerSchema>

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const [isPending, setIsPending] = useState(false)

  const onSubmit = async ({ confirmPassword: _, ...payload }: RegisterFormValues) => {
    setIsPending(true)
    try {
      const user = await register(payload)
      setUser(user)
      navigate(RouteNames.Home)
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === HttpStatus.CONFLICT
          ? t("register.email_taken")
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
          label={t("register.email_label")}
          placeholder={t("register.email_placeholder")}
          error={errors.email?.message}
          {...registerField("email")}
        />

        <PasswordInput
          label={t("register.password_label")}
          placeholder={t("register.password_placeholder")}
          error={errors.password?.message}
          {...registerField("password")}
        />

        <PasswordInput
          label={t("register.confirm_password_label")}
          placeholder={t("register.confirm_password_placeholder")}
          error={errors.confirmPassword?.message}
          {...registerField("confirmPassword")}
        />

        {errors.root && (
          <Text c="red" size="sm">
            {errors.root.message}
          </Text>
        )}

        <Button type="submit" loading={isPending}>
          {t("register.submit")}
        </Button>

        <Anchor component="button" type="button" size="sm" ta="center" onClick={onBack}>
          {t("register.back")}
        </Anchor>
      </Stack>
    </form>
  )
}

export function RegisterPage() {
  const { t, i18n } = useTranslation()
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
            {t("register.title")}
          </Title>

          {method === "select" && (
            <Stack>
              <Alert variant="light" color="blue" icon={<IconBrandTelegram size={16} />}>
                <Stack gap="sm">
                  <Text size="sm">{t("register.telegram_hint")}</Text>
                  <Box style={{ display: "flex", justifyContent: "center" }}>
                    <LoginButton
                      botUsername={BOT_USERNAME}
                      onAuthCallback={handleTelegramAuth}
                      buttonSize="large"
                      cornerRadius={8}
                      showAvatar={false}
                      lang={i18n.language}
                    />
                  </Box>
                </Stack>
              </Alert>

              <Button
                variant="default"
                leftSection={<IconBrandGoogle size={18} />}
                onClick={() => console.log("google")}
              >
                {t("register.sign_up_google")}
              </Button>

              <Divider label={t("register.or")} labelPosition="center" />

              <Button
                variant="light"
                leftSection={<IconMail size={18} />}
                onClick={() => setMethod("email")}
              >
                {t("register.sign_up_email")}
              </Button>
            </Stack>
          )}

          {method === "email" && <EmailForm onBack={() => setMethod("select")} />}

          <Text size="xs" c="dimmed" ta="center">
            {t("register.terms")}
          </Text>

          <Text size="sm" ta="center">
            {t("register.has_account")}{" "}
            <Anchor component={Link} to={RouteNames.Auth}>
              {t("register.sign_in_link")}
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
