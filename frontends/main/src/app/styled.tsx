"use client"

import { styled } from "ol-components"

/*
 * Use in server components gives:
 * Error: Cannot access styled.div on the server. You cannot dot into a client module from a server component. You can only pass the imported name through.
 * Solution for now is to "use client", though I would expect these to be prerendered
 */

export const PageWrapper = styled.div({
  height: "calc(100vh - 80px)",
  display: "flex",
  flexDirection: "column",
})

export const PageWrapperInner = styled.div({
  flex: "1",
  paddingTop: "60px",
})
