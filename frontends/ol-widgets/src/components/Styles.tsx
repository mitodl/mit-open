import React from "react"
import { Global, css } from "ol-components"

const widgetCss = css`
  .ol-widget {
    button {
      padding: 2px;
      font-size: 20px;
      display: inline-flex;
    }
  }

  .ol-widget-header {
    margin-top: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    button {
      font-size: 24px;
      padding: 0;
      margin: 0;
      background-color: transparent;
      border: none;
    }
  }

  .ol-widget.ol-widget-collapsed {
    .ol-widget-header {
      margin: 0;
    }
  }

  .ol-widget-actions {
    &.MuiCardActions-root {
      /* mui puts margins by default, so we need to be extra selective */
      button:last-child {
        margin-left: auto;
      }
    }
  }

  .ol-widget-editing-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ol-widget-dialog.MuiDialog-root {
    /*
      This is the default z-index for MUI anyway.
      Setting it explicitly for use below.
    */
    z-index: 1300;
  }

  .ol-widget-ckeditor {
    --ck-z-modal: 1301;
  }

  .ol-widget-content {
    > *:last-child {
      margin-bottom: 0;
    }
  }

  .ol-widget-url-preview {
    max-width: 300px;
  }
`

const Styles: React.FC = () => {
  return <Global styles={widgetCss}></Global>
}

export default Styles
