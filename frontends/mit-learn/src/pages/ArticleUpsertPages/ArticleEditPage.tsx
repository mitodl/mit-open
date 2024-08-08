import React, { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { useArticleDetail } from "api/hooks/articles"
import ArticleUpsertForm from "@/page-components/ArticleUpsertForm/ArticleUpsertForm"
import { articlesView } from "@/common/urls"
import ArticleUpsertPage from "./ArticleUpsertPage"

type RouteParams = {
  id: string
}

/**
 * Edit articles, reading article id from route.
 */
const ArticleEditPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const article = useArticleDetail(id)
  const navigate = useNavigate()
  const returnToViewing = useCallback(
    () => navigate(articlesView(id)),
    [navigate, id],
  )
  const goHome = useCallback(() => navigate("/"), [navigate])
  const title = article.data?.title ? `${article.data?.title} | Edit` : "Edit"
  return (
    <ArticleUpsertPage title={title}>
      <ArticleUpsertForm
        id={id}
        onCancel={returnToViewing}
        onSaved={returnToViewing}
        onDestroy={goHome}
      />
    </ArticleUpsertPage>
  )
}

export default ArticleEditPage
