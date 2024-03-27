import React from "react"
import { ThemeProvider } from "ol-components"

import { Preview } from "@storybook/react"
import GlobalStyles from "../src/GlobalStyles"

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
        <GlobalStyles />
      </ThemeProvider>
    ),
  ],
  globals: {
    EMBEDLY_KEY: process.env.EMBEDLY_KEY,
  },
}

export default preview
