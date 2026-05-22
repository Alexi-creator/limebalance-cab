import { ApiError } from "@api/apiError"
import { login } from "@api/auth"
import { HttpStatus } from "@constants/httpStatus"
import { RouteNames } from "@constants/routeNames"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Alert,
  Anchor,
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
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

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

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user)
      navigate(RouteNames.Home)
    },
    onError: (err) => {
      const message =
        err instanceof ApiError && err.status === HttpStatus.UNAUTHORIZED
          ? t("auth.invalid_credentials")
          : err.message
      setError("root", { message })
    },
  })

  const onSubmit = (data: AuthFormValues) => mutate(data)

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
                <Text size="sm">{t("auth.telegram_hint")}</Text>
              </Alert>

              <Button
                variant="default"
                leftSection={<IconBrandTelegram size={18} color="#2AABEE" />}
                onClick={() => console.log("telegram")}
              >
                {t("auth.sign_in_telegram")}
              </Button>

              <Button
                variant="default"
                leftSection={<IconBrandGoogle size={18} />}
                onClick={() => console.log("google")}
              >
                {t("auth.sign_in_google")}
              </Button>

              <Divider label={t("auth.or")} labelPosition="center" />

              <Button
                variant="light"
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
        </Stack>
      </Paper>
    </Stack>
  )
}
