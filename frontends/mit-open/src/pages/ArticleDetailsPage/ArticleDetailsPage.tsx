import React from "react"
import { MetaTags } from "ol-utilities"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  Container,
  LoadingSpinner,
  BannerPage,
  ButtonLink,
  Grid,
} from "ol-components"
import { useArticleDetail } from "api/hooks/articles"
import { useParams } from "react-router"
import { articlesEditView } from "@/common/urls"
import { CkeditorDisplay } from "ol-ckeditor"

type RouteParams = {
  id: string
}

const ArticlesDetailPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const article = useArticleDetail(id)

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      className="articles-detail-page"
    >
      <MetaTags title={article.data?.title} />
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full" container>
            {article.data ? (
              <>
                <Grid item xs={9}>
                  <h3>{article.data?.title}</h3>
                </Grid>
                <Grid
                  item
                  xs={3}
                  justifyContent="flex-end"
                  alignItems="center"
                  display="flex"
                >
                  <ButtonLink variant="secondary" href={articlesEditView(id)}>
                    Edit
                  </ButtonLink>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <LoadingSpinner loading={true} />
              </Grid>
            )}
            <CkeditorDisplay
              dangerouslySetInnerHTML={article.data?.html ?? ""}
            />
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default ArticlesDetailPage
