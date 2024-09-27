import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { articlesApi } from "../../clients"
import type {
  ArticlesApiArticlesListRequest as ArticleListRequest,
  Article,
} from "@mitodl/open-api-axios/v1"
import articles from "./keyFactory"

const useArticleList = (
  params: ArticleListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...articles.list(params),
    ...opts,
  })
}

/**
 * Query is diabled if id is undefined.
 */
const useArticleDetail = (id: number | undefined) => {
  return useQuery({
    ...articles.detail(id ?? -1),
    enabled: id !== undefined,
  })
}

const useArticleCreate = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Article, "id">) =>
      articlesApi
        .articlesCreate({ ArticleRequest: data })
        .then((response) => response.data),
    onSuccess: () => {
      client.invalidateQueries(articles.list._def)
    },
  })
}
const useArticleDestroy = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => articlesApi.articlesDestroy({ id }),
    onSuccess: () => {
      client.invalidateQueries(articles.list._def)
    },
  })
}
const useArticlePartialUpdate = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Article> & Pick<Article, "id">) =>
      articlesApi
        .articlesPartialUpdate({
          id,
          PatchedArticleRequest: data,
        })
        .then((response) => response.data),
    onSuccess: (_data) => {
      client.invalidateQueries(articles._def)
    },
  })
}

export {
  useArticleList,
  useArticleDetail,
  useArticleCreate,
  useArticleDestroy,
  useArticlePartialUpdate,
}
