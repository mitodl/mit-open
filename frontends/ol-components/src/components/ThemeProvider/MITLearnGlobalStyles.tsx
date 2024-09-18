"use client"

import React from "react"
import { css, Global } from "@emotion/react"
import { theme } from "./ThemeProvider"
import { preload } from "react-dom"

/**
    Font files for Adobe neue haas grotesk.
    WARNING: This is linked to chudzick@mit.edu's Adobe account.
    We'd prefer a non-personal MIT account to be used.
    See XXX for more.

    Ideally the font would be loaded via a <link /> tag; see
      - https://nextjs.org/docs/app/api-reference/functions/generate-metadata#unsupported-metadata
      - https://github.com/vercel/next.js/discussions/52877
      - https://github.com/vercel/next.js/discussions/50796
 */
const ADOBE_FONT_URL = "https://use.typekit.net/lbk1xay.css"

const pageCss = css`
  @import url("${ADOBE_FONT_URL}"); /**
    @import must come before other styles, including comments
  */

  html {
    font-family: ${theme.typography.body1.fontFamily};
    color: ${theme.typography.body1.color};
  }

  body {
    background-color: ${theme.custom.colors.lightGray1};
    margin: 0;
    padding: 0;
  }

  * {
    box-sizing: border-box;
  }

  #app-container {
    height: calc(100vh - 60px);
    margin-top: 60px;
  }

  a {
    text-decoration: none;
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

const MITLearnGlobalStyles: React.FC = () => {
  /**
   * Preload the font just in case emotion doesn't put the import near top of
   * HTML.
   */
  preload(ADOBE_FONT_URL, { as: "style", fetchPriority: "high" })
  return <Global styles={[pageCss, formCss, muiCss]}></Global>
}

export { MITLearnGlobalStyles }
