import React from "react"
import type { Meta } from "@storybook/react"
import { RoutedDrawer } from "./RoutedDrawer"
import { withRouter } from "storybook-addon-react-router-v6"
import { withQuery } from "@storybook/addon-queryparams"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

const Content = styled.div({
  width: 400,
  padding: 80,
  color: theme.palette.primary.main,
  backgroundColor: theme.custom.colorBackground,
  borderRadius: theme.custom.borderRadius,
  borderShadow: theme.custom.shadow,
})

const meta: Meta<typeof RoutedDrawer> = {
  title: "ol-components/RoutedDrawer",
  decorators: [withRouter, withQuery],
  parameters: {
    query: {
      a: "1",
      b: "2",
    },
  },
}

export default meta

export const Simple = () => {
  const urlParams = Object.keys(new URLSearchParams(document.location.search))

  return (
    <RoutedDrawer
      params={urlParams}
      requiredParams={["a", "b"]}
      key={JSON.stringify(urlParams)}
    >
      {({ closeDrawer }) => (
        <Content>
          <h2>Drawer Content</h2>
          <button
            type="button"
            onClick={() => {
              document.location.search = ""
              closeDrawer()
            }}
          >
            Unset URL Query Params
          </button>
        </Content>
      )}
    </RoutedDrawer>
  )
}
