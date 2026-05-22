import { createTheme } from "@mantine/core"

export const theme = createTheme({
  primaryColor: "teal",
  defaultRadius: "md",
  fontFamily: "Inter, sans-serif",
  colors: {
    teal: [
      "#e6fcf5",
      "#c3fae8",
      "#96f2d7",
      "#63e6be",
      "#38d9a9",
      "#20c997",
      "#12b886",
      "#0ca678",
      "#099268",
      "#087f5b",
    ],
  },
  components: {
    Button: {
      defaultProps: { fw: 500 },
    },
  },
})
