import { IconButton, styled } from "ol-components"
import MenuIcon from "@mui/icons-material/Menu"
import React from "react"

const StyledMenuIcon = styled(MenuIcon)`
  color: ${({ theme }) => theme.custom.colors.black};
`

const MenuButtonText = styled.div(({ theme }) => ({
  alignSelf: "center",
  color: theme.custom.colors.darkGray2.toString(),
  fontSize: theme.typography.body2.fontSize,
  fontWeight: "700",
  paddingLeft: "15px",
}))

const StyledMenuButton = styled.div({
  display: "flex",
  padding: "9px 25px 9px 0px",
  alignItems: "flex-start",
})

interface MenuButtonProps {
  text: string
}

const MenuButton: React.FC<MenuButtonProps> = ({ text }) => (
  <IconButton>
    <StyledMenuButton>
      <StyledMenuIcon />
      <MenuButtonText>{text}</MenuButtonText>
    </StyledMenuButton>
  </IconButton>
)

export { MenuButton }
