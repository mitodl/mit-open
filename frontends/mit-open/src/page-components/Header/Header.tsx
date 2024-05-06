import React, { FunctionComponent } from "react"
import { styled, AppBar, Divider, Toolbar } from "ol-components"
import { MITLogoLink } from "ol-utilities"
import UserMenu from "./UserMenu"
import { MenuButton } from "./MenuButton"

const Bar = styled(AppBar)`
  background-color: ${({ theme }) => theme.custom.colors.white};
  color: ${({ theme }) => theme.custom.colors.black};
  min-height: 55px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(120 169 197 / 15%);
`

const StyledToolbar = styled(Toolbar)({
  flex: 1,
})

const LogoLink = styled(MITLogoLink)({
  width: 45,
  height: "auto",
  img: {
    height: 20,
  },
})

const StyledDivider = styled(Divider)({
  margin: "0.5em 1em",
})

const Spacer = styled.div`
  flex: 1;
`

const Header: FunctionComponent = () => {
  return (
    <Bar position="sticky">
      <StyledToolbar variant="dense">
        <LogoLink />
        <StyledDivider orientation="vertical" flexItem />
        <MenuButton text="Explore MIT" />
        <Spacer />
        <UserMenu />
      </StyledToolbar>
    </Bar>
  )
}

export default Header
