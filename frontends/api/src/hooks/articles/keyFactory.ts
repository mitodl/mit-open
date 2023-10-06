import { articlesApi } from "../../clients"
import type { ArticlesApiArticlesListRequest as ArticleListRequest } from "../../generated"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const articles = createQueryKeys("articles", {
  detail: (id: number) => ({
    queryKey: [id],
    meow: "meow",
    queryFn: () => articlesApi.articlesRetrieve({ id }).then((res) => res.data),
  }),
  list: (params: ArticleListRequest) => ({
    queryKey: [params],
    queryFn: () => articlesApi.articlesList(params).then((res) => res.data),
  }),
})

export default articles
