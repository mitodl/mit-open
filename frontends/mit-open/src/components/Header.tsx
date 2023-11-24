import React, { FunctionComponent } from "react"
import styled from "@emotion/styled"
import { AppBar, Divider, Toolbar } from "ol-design"
import { MITLogoLink } from "ol-util"
import { default as Theme } from "../entry/theme"

interface Props {
  theme?: typeof Theme
  position: string
}

const Bar = styled(AppBar)<Props>`
  background-color: ${({ theme }) => theme.colorBackgroundLight};
  color: ${({ theme }) => theme.fontColorDefault};
  min-height: 55px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(120 169 197 / 15%);
`

const _Toolbar = styled(Toolbar)({
  flex: 1,
})

const LogoLink = styled(MITLogoLink)({
  width: 45,
  height: "auto",
  img: {
    height: 20,
  },
})

const _Divider = styled(Divider)({
  margin: "0.5em 1em",
})

const Header: FunctionComponent = () => {
  return (
    <Bar position="sticky">
      <_Toolbar variant="dense">
        <LogoLink />
        <_Divider orientation="vertical" flexItem />
      </_Toolbar>
    </Bar>
  )
}

export default Header
