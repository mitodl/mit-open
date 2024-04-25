import { Container, Typography } from "ol-components"
import { MetaTags } from "ol-utilities"
import React from "react"

const DashboardPage: React.FC = () => {
  return (
    <Container>
      <MetaTags>
        <title>Dashboard</title>
      </MetaTags>
      <Typography variant="h1">Dashboard</Typography>
      <p>Coming soon!</p>
    </Container>
  )
}

export default DashboardPage
