import { articlesApi } from "../../clients"
import type { ArticlesApiArticlesListRequest as ArticleListRequest } from "@mitodl/open-api-axios/v1"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const articles = createQueryKeys("articles", {
  detail: (id: number) => ({
    queryKey: [id],
    queryFn: () => {
      if (id < 0) return Promise.reject("Invalid ID")
      return articlesApi.articlesRetrieve({ id }).then((res) => res.data)
    },
  }),
  list: (params: ArticleListRequest) => ({
    queryKey: [params],
    queryFn: () => articlesApi.articlesList(params).then((res) => res.data),
  }),
})

export default articles
