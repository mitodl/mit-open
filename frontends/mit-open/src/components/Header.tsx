import React from "react"
import { AppBar, Divider, Toolbar } from "ol-design"

import { MITLogoLink } from "ol-util"

const Header: React.FC = () => {
  return (
    <AppBar className="ic-header" position="sticky">
      <Toolbar variant="dense">
        <MITLogoLink className="ic-mit-logo" />
        <Divider className="ic-divider" orientation="vertical" flexItem />
      </Toolbar>
    </AppBar>
  )
}

export default Header
