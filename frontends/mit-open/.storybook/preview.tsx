import React from "react"
import { ThemeProvider } from "ol-components"

import { Preview } from "@storybook/react"

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default preview
