import React from "react"
import { BannerPage, LoadingSpinner, MetaTags } from "ol-util"
import { GridColumn, GridContainer } from "../../components/layout"
import Container from "@mui/material/Container"
import { useArticleDetail } from "api/hooks/articles"
import { useParams } from "react-router"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import { articlesEditView } from "../urls"

type RouteParams = {
  id: string
}

const ArticlesDetailPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const article = useArticleDetail(id)

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      compactOnMobile
      className="articles-detail-page"
    >
      <MetaTags>
        <title>{article.data?.title}</title>
      </MetaTags>
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full" container>
            {article.data ? (
              <>
                <Grid item xs={9}>
                  <h3 className="post-title">{article.data?.title}</h3>
                </Grid>
                <Grid item xs={3} className="ic-centered-right">
                  <Button
                    variant="outlined"
                    disableElevation
                    href={articlesEditView(id)}
                  >
                    Edit
                  </Button>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <LoadingSpinner loading={true} />
              </Grid>
            )}
            <div
              className="ck-content"
              dangerouslySetInnerHTML={{
                __html: article.data?.html ?? "",
              }}
            />
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default ArticlesDetailPage
