import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { AdornmentButton } from "./Input"
import Input from "@mui/material/OutlinedInput"
import { Stack } from "@mui/system"
import Grid from "@mui/material/Grid"
import SearchIcon from "@mui/icons-material/Search"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import CloseIcon from "@mui/icons-material/Close"
import InputAdornment from "@mui/material/InputAdornment"

const meta: Meta<typeof Input> = {
  title: "smoot-design/Input",
}
export default meta

type Story = StoryObj<typeof Input>

export const Basic: Story = {
  render: () => {
    return (
      <Stack direction="row" gap={1}>
        <Input />
        <Input size="hero" />
      </Stack>
    )
  },
}

export const Adornments: Story = {
  render: () => {
    return (
      <Grid container maxWidth="600px" spacing={2}>
        <Grid item xs={6}>
          <Input
            startAdornment={
              <InputAdornment position="start">
                <AdornmentButton>
                  <SearchIcon />
                </AdornmentButton>
              </InputAdornment>
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Input
            size="hero"
            startAdornment={
              <AdornmentButton>
                <SearchIcon />
              </AdornmentButton>
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Input
            endAdornment={
              <AdornmentButton>
                <CalendarTodayIcon />
              </AdornmentButton>
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Input
            size="hero"
            endAdornment={
              <AdornmentButton>
                <CalendarTodayIcon />
              </AdornmentButton>
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Input
            endAdornment={
              <>
                <AdornmentButton>
                  <CloseIcon />
                </AdornmentButton>
                <AdornmentButton>
                  <CalendarTodayIcon />
                </AdornmentButton>
              </>
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Input
            size="hero"
            endAdornment={
              <>
                <AdornmentButton>
                  <CloseIcon />
                </AdornmentButton>
                <AdornmentButton>
                  <CalendarTodayIcon />
                </AdornmentButton>
              </>
            }
          />
        </Grid>
      </Grid>
    )
  },
}
