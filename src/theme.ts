import {
  createTheme,
  Modal,
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
