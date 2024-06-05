import React from "react"
import {
  Container,
  MuiCard,
  CardContent,
  CardActions,
  ButtonLink,
} from "ol-components"
import { HOME } from "@/common/urls"
import { MetaTags } from "ol-utilities"

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
      <MuiCard sx={{ marginTop: "1rem" }}>
        <MetaTags>
          <meta name="robots" content="noindex,noarchive" />
          <title>{title}</title>
        </MetaTags>
        <CardContent>{children}</CardContent>
        <CardActions>
          <ButtonLink variant="secondary" href={HOME}>
            Home
          </ButtonLink>
        </CardActions>
      </MuiCard>
    </Container>
  )
}

export default ErrorPageTemplate
