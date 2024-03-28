import React, { useMemo } from "react"

import { useParams } from "react-router"

import {
  useInfiniteUserListItems,
  useUserListsDetail,
} from "api/hooks/learningResources"

import { LIST_TYPE_USER_LIST } from "@/common/constants"
import { LearningResourceListItem } from "../ListDetailsPage/ItemsListing"
import ListDetailsPage from "../ListDetailsPage/ListDetailsPage"

type RouteParams = {
  id: string
}

const UserListDetailsPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const pathQuery = useUserListsDetail(id)
  const itemsQuery = useInfiniteUserListItems({ userlist_id: id })
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return (
      pages?.flatMap(
        (p) => (p.results as unknown as LearningResourceListItem) ?? [],
      ) ?? []
    )
  }, [itemsQuery.data])

  return (
    <ListDetailsPage
      listType={LIST_TYPE_USER_LIST}
      title={pathQuery?.data?.title}
      description={pathQuery.data?.description}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      handleEdit={() => {}}
    />
  )
}

export default UserListDetailsPage
