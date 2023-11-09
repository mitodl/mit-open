import React from "react"
import { BannerPage, MetaTags } from "ol-util"
import { GridColumn, GridContainer } from "../../components/layout"
import { Container, LoadingSpinner } from "ol-design"
import { useArticleDetail } from "api/hooks/articles"
import { useParams } from "react-router"
import { ButtonLink } from "ol-design"
import { Grid } from "ol-design"
import { articlesEditView } from "../urls"
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
                  <ButtonLink variant="outlined" to={articlesEditView(id)}>
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
