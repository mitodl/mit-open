import React from "react"
import CircularProgress from "@mui/material/CircularProgress"
import Fade from "@mui/material/Fade"
import styled from "@emotion/styled"

const Container = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

  "&.MuiCircularProgress-root": {
    transitionDelay: "800ms",
  },
})

type LoadingSpinnerProps = {
  loading: boolean
  "aria-label"?: string
}

const noDelay = { transitionDelay: "0ms" }

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading,
  "aria-label": label = "Loading",
}) => {
  return (
    <Container>
      <Fade in={loading} style={!loading ? noDelay : undefined} unmountOnExit>
        <CircularProgress aria-label={label} />
      </Fade>
    </Container>
  )
}

export { LoadingSpinner }
export type { LoadingSpinnerProps }
