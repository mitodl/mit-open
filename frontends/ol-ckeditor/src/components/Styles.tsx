import React from "react"
import { Global, css } from "ol-components"

const pageCss = css`
  .ck.ck-balloon-panel.ck-powered-by-balloon,
  .ck.ck-balloon-panel_visible.ck-powered-by-balloon {
    display: none !important;
  }
`

const Styles: React.FC = () => {
  return <Global styles={[pageCss]}></Global>
}

export default Styles
