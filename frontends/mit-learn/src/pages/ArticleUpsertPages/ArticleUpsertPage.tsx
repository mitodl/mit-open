import React from "react"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { Container, BannerPage } from "ol-components"
import MetaTags from "@/page-components/MetaTags/MetaTags"

type ArticleUpsertPageProps = {
  children: React.ReactNode
  title: string
}

const ArticleUpsertPage: React.FC<ArticleUpsertPageProps> = ({
  children,
  title,
}) => {
  return (
    <BannerPage src="/static/images/course_search_banner.png">
      <MetaTags title={title} social={false} />
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full">{children}</GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default ArticleUpsertPage
