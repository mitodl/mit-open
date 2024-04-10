import React from "react"
import { Global, css, theme } from "ol-components"

const pageCss = css`
  html {
    font-family: ${theme.custom.fontFamilyDefault};
    color: ${theme.custom.fontColorDefault};
  }

  body {
    background-color: ${theme.custom.colorBackground};
    margin: 0;
    padding: 0;
  }

  * {
    box-sizing: border-box;
  }

  #app-container {
    height: 100vh;
  }

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    color: inherit;
  }

  h1 {
    font-size: ${theme.custom.fontSizeH1};
  }

  h2 {
    font-size: ${theme.custom.fontSizeH2};
  }

  h4 {
    font-size: ${theme.custom.fontSizeH4};
  }
`

const formCss = css`
  form,
  .form {
    select {
      background: #f8f8f8;
      border: 1px solid #bbb;
      font-size: 15px;
      color: ${theme.custom.fontColorDefault};
      border-radius: ${theme.custom.stdBorderRadius};
      height: 39px;

      /* If you add too much padding here, the options won't show in IE */
      padding: 8px 20px;
      width: 100%;
    }
  }

  form .form-row,
  .form-header .form-row {
    margin: 10px 0 24px;
  }

  .MuiDialogContent-root {
    .MuiFormControl-root:first-of-type {
      margin-top: 0;
    }

    .MuiFormControl-root:last-child {
      margin-bottom: 0;
    }
  }
`

const muiCss = css`
  #app-container {
    .MuiCardContent-root {
      padding-bottom: 16px;

      &:last-child {
        padding-bottom: 16px; /* MUI puts extra padding on the last child by default. We don't want it. */
      }

      > *:first-of-type {
        margin-top: 0; /* No extra space for the first child, beyond the card content's padding. */
      }
    }

    .MuiCardActions-root {
      padding-left: 16px;
      padding-right: 16px;
    }

    .MuiCard-root {
      color: ${theme.custom.fontColorDefault};
      transition-duration: ${theme.custom.transitionDuration};
      transition-property: box-shadow;

      &:hover {
        box-shadow: ${theme.custom.shadow};
      }
    }
  }
`

const GlobalStyles: React.FC = () => {
  return <Global styles={[pageCss, formCss, muiCss]}></Global>
}

export default GlobalStyles
