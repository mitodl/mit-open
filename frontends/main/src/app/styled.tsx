"use client"

import { styled } from "ol-components"

/*
 * Use in server components gives:
 * Error: Cannot access styled.div on the server. You cannot dot into a client module from a server component. You can only pass the imported name through.
 * Solution for now is to "use client", though I would expect these to be prerendered
 */

export const PageWrapper = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 72px)",
  marginTop: "72px",
  [theme.breakpoints.down("sm")]: {
    marginTop: "60px",
    height: "calc(100vh - 60px)",
  },
}))

export const PageWrapperInner = styled.div({
  flex: "1",
})
