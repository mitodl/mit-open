import React, { useCallback } from "react"
import { useNavigate } from "react-router"
import ArticleUpsertForm from "@/page-components/ArticleUpsertForm/ArticleUpsertForm"
import { articlesView } from "@/common/urls"
import ArticleUpsertPage from "./ArticleUpsertPage"

/**
 * Create new articles.
 */
export const ArticleCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const goHome = useCallback(() => navigate("/"), [navigate])
  const viewDetails = useCallback(
    (id: number) => navigate(articlesView(id)),
    [navigate],
  )
  return (
    <ArticleUpsertPage title="New Article">
      <ArticleUpsertForm
        onCancel={goHome}
        onSaved={viewDetails}
        onDestroy={goHome}
      />
    </ArticleUpsertPage>
  )
}

export default ArticleCreatePage
