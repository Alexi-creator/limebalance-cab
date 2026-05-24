import { createTheme } from "@mantine/core"

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
  },
})
