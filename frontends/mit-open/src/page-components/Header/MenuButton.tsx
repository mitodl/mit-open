import { ActionButton, Button, styled } from "ol-components"
import { RiMenuLine } from "@remixicon/react"
import React from "react"

const MenuIcon = styled(RiMenuLine)(({ theme }) => ({
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

const StyledMenuButton = styled(Button)({
  padding: "0",
  background: "transparent",
  "&:hover:not(:disabled)": {
    background: "transparent",
  },
})

interface MenuButtonProps {
  text?: string
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined
}

const MenuButton: React.FC<MenuButtonProps> = ({ text, onClick }) => (
  <StyledMenuButton onClick={onClick}>
    <MenuButtonInner>
      <ActionButton variant="text">
        <MenuIcon />
      </ActionButton>
      {text ? <MenuButtonText>{text}</MenuButtonText> : ""}
    </MenuButtonInner>
  </StyledMenuButton>
)

export { MenuButton }
