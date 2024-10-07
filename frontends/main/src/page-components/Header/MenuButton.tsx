"use client"

import { styled } from "ol-components"
import { RiMenuLine, RiCloseLargeLine } from "@remixicon/react"
import React from "react"

const MenuIcon = styled(RiMenuLine)(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
}))

const CloseMenuIcon = styled(RiCloseLargeLine)(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
}))

const MenuButtonText = styled.div(({ theme }) => ({
  alignSelf: "center",
  paddingLeft: "16px",
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
  ...theme.typography.subtitle2,
}))

const MenuButtonInner = styled.div({
  display: "flex",
  alignItems: "flex-start",
})

const StyledMenuButton = styled.button(({ theme }) => ({
  padding: "8px 16px",
  background: "transparent",
  "&:hover:not(:disabled)": {
    background: "transparent",
  },
  touchAction: "none",
  textAlign: "center",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  color: theme.custom.colors.white,
  transition: `background ${theme.transitions.duration.short}ms`,
  cursor: "pointer",
  borderStyle: "none",
  svg: {
    color: theme.custom.colors.white,
  },
  [theme.breakpoints.down("sm")]: {
    padding: "4px 0",
  },
}))

interface MenuButtonProps {
  text?: string
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined
  drawerOpen: boolean
}

const MenuButton: React.FC<MenuButtonProps> = ({
  text,
  onClick,
  drawerOpen,
}) => (
  <StyledMenuButton onPointerDown={onClick}>
    <MenuButtonInner>
      {drawerOpen ? <CloseMenuIcon /> : <MenuIcon />}
      {text ? <MenuButtonText>{text}</MenuButtonText> : ""}
    </MenuButtonInner>
  </StyledMenuButton>
)

export { MenuButton }
