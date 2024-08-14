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
  color: theme.custom.colors.darkGray2,
  paddingLeft: "16px",
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
  ...theme.typography.subtitle2,
}))

const MenuButtonInner = styled.div({
  display: "flex",
  padding: "8px 0",
  alignItems: "flex-start",
})

const StyledMenuButton = styled.button(({ theme }) => ({
  padding: "0",
  background: "transparent",
  "&:hover:not(:disabled)": {
    background: "transparent",
  },
  touchAction: "none",
  textAlign: "center",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  color: theme.palette.text.primary,
  transition: `background ${theme.transitions.duration.short}ms`,
  cursor: "pointer",
  borderStyle: "none",
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
