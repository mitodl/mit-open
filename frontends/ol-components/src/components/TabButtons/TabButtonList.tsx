import React from "react"
import MuiTab from "@mui/material/Tab"
import type { TabProps } from "@mui/material/Tab"
import MuiTabList from "@mui/lab/TabList"
import type { TabListProps } from "@mui/lab/TabList"
import styled from "@emotion/styled"
import { Button, ButtonLink } from "../Button/Button"
import type { ButtonLinkProps, ButtonProps } from "../Button/Button"
import { css } from "@emotion/react"
import type { Theme } from "@mui/material/styles"

const defaultTabListProps = {
  variant: "scrollable",
  allowScrollButtonsMobile: true,
  scrollButtons: "auto",
} as const
const TabButtonList: React.FC<TabListProps> = styled((props: TabListProps) => (
  <MuiTabList {...defaultTabListProps} {...props} />
))([
  {
    minHeight: "unset",
    ".MuiTabs-indicator": {
      display: "none",
    },
    ".MuiTabs-flexContainer": {
      gap: "8px",
      alignItems: "center",
    },
    ".MuiTabs-scroller": {
      display: "flex",
    },
  },
])

const tabStyles = ({ theme }: { theme: Theme }) =>
  css({
    ":focus-visible": {
      outlineOffset: "-1px",
    },
    '&[aria-selected="true"]': {
      backgroundColor: theme.custom.colors.white,
      borderColor: theme.custom.colors.darkGray2,
    },
  })
const TabButtonStyled = styled(Button)(tabStyles)
const TabLinkStyled = styled(ButtonLink)(tabStyles)

const tabButtonProps = {
  variant: "tertiary",
  size: "small",
} as const
const TabButtonInner = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // Omits the `className` prop from the underlying Button so that MUI does not
  // style it. We style it ourselves.
  (props, ref) => {
    const { className, ...others } = props
    return <TabButtonStyled {...tabButtonProps} {...others} ref={ref} />
  },
)

const TabLinkInner = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (props, ref) => {
    const { className, ...others } = props
    return <TabLinkStyled {...tabButtonProps} {...others} ref={ref} />
  },
)

const TabButton = (props: TabProps<"button">) => (
  <MuiTab {...props} component={TabButtonInner} />
)
const TabButtonLink = (props: TabProps<"a">) => (
  <MuiTab {...props} component={TabLinkInner} />
)

export { TabButtonList, TabButton, TabButtonLink }
