import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { RoutedDrawer } from "./RoutedDrawer"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

const Content = styled.div({
  width: 400,
  padding: 80,
  color: theme.palette.primary.main,
  borderShadow: theme.custom.shadow,
})

const meta: Meta<typeof RoutedDrawer> = {
  title: "smoot-design/RoutedDrawer",
}

export default meta

type Story = StoryObj<typeof RoutedDrawer>

export const Simple: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        query: { a: "1", b: "2" },
      }
    },
  },
  render: () => (
    <RoutedDrawer params={["a", "b", "c"]} requiredParams={["a", "b"]}>
      {({ closeDrawer }) => (
        <Content>
          <h2>Drawer Content</h2>
          <button type="button" onClick={closeDrawer}>
            Unset URL Query Params
          </button>
        </Content>
      )}
    </RoutedDrawer>
  ),
}

export const NotPresent = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        query: { a: "1"  },
      }
    },
  },
  render: () => (
    <RoutedDrawer params={["a", "b", "c"]} requiredParams={["a", "b"]}>
      {({ closeDrawer }) => (
        <Content>
          <h2>Drawer Content</h2>
          <button type="button" onClick={closeDrawer}>
            Unset URL Query Params
          </button>
        </Content>
      )}
    </RoutedDrawer>
  ),
}
