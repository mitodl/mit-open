import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { PlatformLogo, PLATFORMS } from "./Logo"
import Grid from "@mui/material/Grid"
import styled from "@emotion/styled"
import { PlatformEnum } from "api"

type StoryProps = { showIconBackground?: boolean; iconHeight?: string }
const SizedPlatformLogo = styled(PlatformLogo)<StoryProps>(
  ({ showIconBackground }) => [
    {
      height: "27px",
    },
    showIconBackground && {
      backgroundColor: "pink",
    },
  ],
)

const meta: Meta<StoryProps> = {
  title: "smoot-design/PlatformLogo",
  render: ({ showIconBackground, iconHeight }) => {
    return (
      <Grid container rowSpacing="12px">
        <Grid item xs={12}>
          <strong>Note</strong>: the <code>showIconBackground</code> and{" "}
          <code>iconHeight</code>
          args are only for this story. Not applicable to the actual component.
        </Grid>
        {Object.entries(PLATFORMS).map(([platformCode, platform]) => (
          <React.Fragment key={platformCode}>
            <Grid item xs={2}>
              <code>{platformCode}</code>
            </Grid>
            <Grid item xs={2}>
              {platform.name}
            </Grid>
            <Grid item xs={8}>
              <SizedPlatformLogo
                iconHeight={iconHeight}
                showIconBackground={showIconBackground}
                platformCode={platformCode as PlatformEnum}
              />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    )
  },
  args: {
    showIconBackground: false,
    iconHeight: "35px",
  },
}
export default meta

type Story = StoryObj<StoryProps>

export const All: Story = {}
