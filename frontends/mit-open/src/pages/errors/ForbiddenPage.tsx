import React from "react"
import Container from "@mui/material/Container"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import CardActions from "@mui/material/CardActions"
import { ButtonLink } from "ol-design"

import { HOME } from "../urls"
import { MetaTags } from "ol-util"

const ForbiddenPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Card sx={{ marginTop: "1rem" }}>
        <MetaTags>
          <meta name="robots" content="noindex,noarchive" />
        </MetaTags>
        <CardContent>
          <h1>403 Forbidden Error</h1>
          You do not have permission to access this resource.
        </CardContent>
        <CardActions>
          <ButtonLink variant="outlined" to={HOME}>
            Home
          </ButtonLink>
        </CardActions>
      </Card>
    </Container>
  )
}

export default ForbiddenPage
