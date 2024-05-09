import { Button, styled } from "ol-components"
import MenuIcon from "@mui/icons-material/Menu"
import React from "react"

const StyledMenuIcon = styled(MenuIcon)(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
}))

const MenuButtonText = styled.div(({ theme }) => ({
  alignSelf: "center",
  color: theme.custom.colors.darkGray2,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: "700",
  paddingLeft: "15px",
}))

const MenuButtonInner = styled.div({
  display: "flex",
  padding: "9px 25px 9px 0px",
  alignItems: "flex-start",
})

const StyledMenuButton = styled(Button)({
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
