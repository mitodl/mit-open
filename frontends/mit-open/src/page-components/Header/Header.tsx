import React, { FunctionComponent } from "react"
import {
  styled,
  AppBar,
  Divider,
  Toolbar,
  ClickAwayListener,
} from "ol-components"
import { MITLogoLink, useToggle } from "ol-utilities"
import UserMenu from "./UserMenu"
import { MenuButton } from "./MenuButton"
import NavDrawer from "../NavDrawer/NavDrawer"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { useSearchParams } from "react-router-dom"

const Bar = styled(AppBar)`
  height: 56px;
  padding: 0 8px;
  z-index: ${({ theme }) => theme.zIndex.drawer + 1};
  background-color: ${({ theme }) => theme.custom.colors.white};
  color: ${({ theme }) => theme.custom.colors.black};
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
  const [drawerOpen, toggleDrawer] = useToggle(false)
  const [searchParams] = useSearchParams()
  const resourceDrawerOpen = searchParams.has(RESOURCE_DRAWER_QUERY_PARAM)

  const toggler = (event: React.MouseEvent) => {
    if (!resourceDrawerOpen) {
      event.stopPropagation()
    }
    toggleDrawer(!drawerOpen)
  }
  const closeDrawer = (event: MouseEvent | TouchEvent) => {
    if (drawerOpen && !resourceDrawerOpen) {
      event.preventDefault()
      toggleDrawer(false)
    }
  }

  return (
    <div>
      <Bar position="fixed">
        <StyledToolbar variant="dense">
          <LogoLink />
          <StyledDivider orientation="vertical" flexItem />
          <MenuButton text="Explore MIT" onClick={toggler} />
          <Spacer />
          <UserMenu />
        </StyledToolbar>
      </Bar>
      <ClickAwayListener onClickAway={closeDrawer}>
        <div role="presentation">
          <NavDrawer open={drawerOpen} onClose={toggleDrawer.off}></NavDrawer>
        </div>
      </ClickAwayListener>
    </div>
  )
}

export default Header
