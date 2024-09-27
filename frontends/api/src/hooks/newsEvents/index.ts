import { useQuery } from "@tanstack/react-query"
import newsEvents from "./keyFactory"
import {
  NewsEventsApiNewsEventsListRequest,
  NewsEventsListFeedTypeEnum,
} from "@mitodl/open-api-axios/v0"

const useNewsEventsList = (params: NewsEventsApiNewsEventsListRequest) => {
  return useQuery({
    ...newsEvents.list(params),
  })
}

const useNewsEventsDetail = (id: number) => {
  return useQuery(newsEvents.detail(id))
}

export { useNewsEventsList, useNewsEventsDetail, NewsEventsListFeedTypeEnum }
