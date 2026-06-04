import {
  createTheme,
  Modal,
  Notification,
  NumberInput,
  PasswordInput,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"

/** «Плавающий» лейбл: абсолютный, сидит на рамке инпута (показывается только при заданном `label`). */
const floatingLabel = {
  root: { position: "relative" as const },
  label: {
    position: "absolute" as const,
    top: -6,
    left: 10,
    zIndex: 1,
    background: "var(--mantine-color-body)",
    padding: "0 4px",
    fontSize: 11,
    lineHeight: 1,
  },
}

export const theme = createTheme({
  primaryColor: "lime",
  defaultRadius: "md",
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "Geist Mono, monospace",
  components: {
    Button: {
      defaultProps: { fw: 500 },
    },
    Paper: {
      defaultProps: { withBorder: true },
    },
    // заливаем весь тост цветом (зелёный по умолчанию, красный для ошибок), текст — белый,
    // иначе цвет красит лишь тонкую полоску слева и карточка сливается с фоном страницы
    Notification: Notification.extend({
      defaultProps: { color: "green" },
      styles: {
        root: { backgroundColor: "var(--notification-color)" },
        title: { color: "var(--mantine-color-white)" },
        description: { color: "var(--mantine-color-white)" },
        closeButton: { color: "var(--mantine-color-white)" },
      },
    }),
    TextInput: TextInput.extend({ styles: floatingLabel }),
    PasswordInput: PasswordInput.extend({ styles: floatingLabel }),
    NumberInput: NumberInput.extend({ styles: floatingLabel }),
    Textarea: Textarea.extend({ styles: floatingLabel }),
    Select: Select.extend({ styles: floatingLabel }),
    DatePickerInput: DatePickerInput.extend({ styles: floatingLabel }),
    // запас сверху, чтобы «плавающий» лейбл первого поля не упирался в шапку модалки
    Modal: Modal.extend({
      styles: { body: { paddingTop: "calc(var(--mantine-spacing-md) + 6px)" } },
    }),
  },
})
