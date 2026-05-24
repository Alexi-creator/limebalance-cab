import { createTheme } from "@mantine/core"

export const theme = createTheme({
  primaryColor: "lime",
  defaultRadius: "md",
  fontFamily: "Inter, sans-serif",
  components: {
    Button: {
      defaultProps: { fw: 500 },
    },
  },
})
