import React from "react"
import {
  Container,
  MuiCard,
  CardContent,
  CardActions,
  ButtonLink,
} from "ol-components"
import { HOME } from "@/common/urls"

type ErrorPageTemplateProps = {
  title: string
  children: React.ReactNode
}

const ErrorPageTemplate: React.FC<ErrorPageTemplateProps> = ({ children }) => {
  return (
    <Container maxWidth="sm">
      <MuiCard sx={{ marginTop: "1rem" }}>
        {/* TODO <Helmet>
          <title>{`${title} | ${APP_SETTINGS.SITE_NAME}`}</title>
          <meta name="robots" content="noindex,noarchive" />
        </Helmet> */}
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
