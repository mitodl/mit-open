import { Container, Typography } from "ol-components"
import { MetaTags } from "ol-utilities"
import React from "react"

const AboutPage: React.FC = () => {
  return (
    <Container>
      <MetaTags>
        <title>About Us</title>
      </MetaTags>
      <Typography variant="h1">About Us</Typography>
      <p>Coming soon!</p>
    </Container>
  )
}

export default AboutPage
