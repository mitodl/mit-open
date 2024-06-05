/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { TabButtonList, TabButton, TabButtonLink } from "./TabButtonList"
import TabContext from "@mui/lab/TabContext"
import { Button } from "../Button/Button"
import Stack from "@mui/material/Stack"
import TabPanel from "@mui/lab/TabPanel"
import Typography from "@mui/material/Typography"
import { faker } from "@faker-js/faker/locale/en"
import Container from "@mui/material/Container"
import { TabListProps } from "@mui/lab/TabList"
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6"
import { useLocation } from "react-router"

type StoryProps = TabListProps & {
  count: number
}

const meta: Meta<StoryProps> = {
  title: "smoot-design/Tabs",
  argTypes: {
    variant: {
      options: ["scrollable", "fullWidth", "standard"],
      control: { type: "radio" },
    },
    scrollButtons: {
      options: ["auto", true, false],
      control: { type: "radio" },
    },
  },
  args: {
    count: 4,
    variant: "scrollable",
    allowScrollButtonsMobile: true,
    scrollButtons: "auto",
  },
  render: ({ count, ...others }) => {
    const [value, setValue] = React.useState("tab1")
    return (
      <Container maxWidth="sm">
        <TabContext value={value}>
          <Stack direction="row">
            <TabButtonList
              {...others}
              onChange={(_event, val) => setValue(val)}
            >
              {Array(count)
                .fill(null)
                .map((_, i) => (
                  <TabButton
                    key={`tab-${i}`}
                    value={`tab${i + 1}`}
                    label={`Tab ${i + 1}`}
                  />
                ))}
            </TabButtonList>

            <Stack
              direction="row"
              justifyContent="end"
              sx={{ paddingLeft: "16px" }}
            >
              <Button>Other UI</Button>
            </Stack>
          </Stack>
          {Array(count)
            .fill(null)
            .map((_, i) => (
              <TabPanel key={`tab-${i}`} value={`tab${i + 1}`}>
                <Typography variant="h4">Header {i + 1}</Typography>
                {faker.lorem.paragraphs(2)}
              </TabPanel>
            ))}
        </TabContext>
      </Container>
    )
  },
}

export default meta

type Story = StoryObj<StoryProps>

export const ButtonTabs: Story = {}
export const ManyButtonTabs: Story = {
  args: {
    count: 12,
  },
}

export const LinkTabs: Story = {
  decorators: [withRouter],
  parameters: {
    reactRouter: reactRouterParameters({
      location: {
        hash: "#link2",
      },
    }),
  },
  render: () => {
    const location = useLocation()
    return (
      <div>
        Current Location:
        <pre>{JSON.stringify(location, null, 2)}</pre>
        <TabContext value={location.hash}>
          <TabButtonList>
            <TabButtonLink value="#link1" href="#link1" label="Tab 1" />
            <TabButtonLink value="#link2" href="#link2" label="Tab 2" />
            <TabButtonLink value="#link3" href="#link3" label="Tab 3" />
          </TabButtonList>
        </TabContext>
      </div>
    )
  },
}
