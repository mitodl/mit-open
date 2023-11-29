import React from "react"
import { Container, Card, CardContent, CardActions } from "ol-design"
import { ButtonLink } from "ol-design"

import { HOME } from "../urls"
import { MetaTags } from "ol-util"

type ErrorPageTemplateProps = {
  title: string
  children: React.ReactNode
}

const ErrorPageTemplate: React.FC<ErrorPageTemplateProps> = ({
  title,
  children,
}) => {
  return (
    <Container maxWidth="sm">
      <Card sx={{ marginTop: "1rem" }}>
        <MetaTags>
          <meta name="robots" content="noindex,noarchive" />
          <title>{title}</title>
        </MetaTags>
        <CardContent>{children}</CardContent>
        <CardActions>
          <ButtonLink variant="outlined" to={HOME}>
            Home
          </ButtonLink>
        </CardActions>
      </Card>
    </Container>
  )
}

export default ErrorPageTemplate
