import {
  createTheme,
  InputBase,
  Modal,
  Notification,
  NumberInput,
  PasswordInput,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"

/** "Floating" label: absolute, sits on the input border (shown only when `label` is set). */
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
    // fill the whole toast with color (green by default, red for errors), text is white,
    // otherwise the color only paints a thin strip on the left and the card blends into the page background
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
    InputBase: InputBase.extend({ styles: floatingLabel }),
    DatePickerInput: DatePickerInput.extend({ styles: floatingLabel }),
    // extra space on top so the first field's "floating" label does not bump into the modal header
    Modal: Modal.extend({
      styles: { body: { paddingTop: "calc(var(--mantine-spacing-md) + 6px)" } },
    }),
  },
})
