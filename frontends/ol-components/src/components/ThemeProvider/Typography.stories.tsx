import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"

const meta: Meta<typeof Typography> = {
  title: "smoot-design/Typography",
}

export default meta

type Story = StoryObj<typeof Typography>

export const Headings: Story = {
  render: () => {
    return (
      <>
        <Typography variant="h1">Heading level 1</Typography>
        <Typography variant="h2">Heading level 2</Typography>
        <Typography variant="h3">Heading level 3</Typography>
        <Typography variant="h4">Heading level 4</Typography>
        <Typography variant="h5">Heading level 5</Typography>
      </>
    )
  },
}

export const Subtitles: Story = {
  render: () => {
    return (
      <>
        <Typography variant="subtitle1">Subtitle level 1</Typography>
        <Typography variant="subtitle2">Subtitle level 2</Typography>
        <Typography variant="subtitle3">Subtitle level 3</Typography>
        <Typography variant="subtitle4">Subtitle level 4</Typography>
      </>
    )
  },
}

export const Paragraphs: Story = {
  render: () => {
    const text = "The quick brown fox jumps over the lazy dog. ".repeat(10)
    return (
      <ul>
        <li>
          <Typography variant="body1">Body level 1, {text}</Typography>
        </li>
        <li>
          <Typography variant="body2">Body level 2, {text}</Typography>
        </li>
        <li>
          <Typography variant="body3">Body level 3, {text}</Typography>
        </li>
        <li>
          <Typography variant="body4">Body level 4, {text}</Typography>
        </li>
      </ul>
    )
  },
}

export const Buttons: Story = {
  render: () => {
    return (
      <Stack spacing={2} direction="row" alignItems="center">
        <Button size="micro" variant="outlined">
          Micro
        </Button>
        <Button size="small" variant="outlined">
          Small
        </Button>
        <Button size="large" variant="outlined">
          Large
        </Button>
      </Stack>
    )
  },
}
