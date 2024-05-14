import { Button, styled } from "ol-components"
import MenuIcon from "@mui/icons-material/Menu"
import React from "react"

const StyledMenuIcon = styled(MenuIcon)(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
}))

const MenuButtonText = styled.div(({ theme }) => ({
  alignSelf: "center",
  color: theme.custom.colors.darkGray2,
  paddingLeft: "16px",
  textTransform: "none",
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
  text: string
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined
}

const MenuButton: React.FC<MenuButtonProps> = ({ text, onClick }) => (
  <StyledMenuButton onClick={onClick}>
    <MenuButtonInner>
      <StyledMenuIcon />
      <MenuButtonText>{text}</MenuButtonText>
    </MenuButtonInner>
  </StyledMenuButton>
)

export { MenuButton }
