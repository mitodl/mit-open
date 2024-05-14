import React from "react"
import { Global, css, theme } from "ol-components"

const pageCss = css`
  html {
    font-family: ${theme.typography.body1.fontFamily};
    color: ${theme.typography.body1.color};
  }

  body {
    background-color: ${theme.custom.oldBackgroundColor};
    margin: 0;
    padding: 0;
  }

  * {
    box-sizing: border-box;
  }

  #app-container {
    height: 100vh;
    margin-top: 55px;
  }

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    color: inherit;
  }

  h1 {
    font-size: ${theme.typography.h1.fontSize};
  }

  h2 {
    font-size: ${theme.typography.h2.fontSize};
  }

  h4 {
    font-size: ${theme.typography.h4.fontSize};
  }
`

const formCss = css`
  form,
  .form {
    select {
      background: #f8f8f8;
      border: 1px solid #bbb;
      font-size: 15px;
      color: ${theme.typography.body1.color};
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
