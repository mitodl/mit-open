import React, { useMemo } from "react"

import { useParams } from "react-router"

import {
  useInfiniteUserListItems,
  useUserListsDetail,
} from "api/hooks/learningResources"

import { ListType } from "api/constants"
import { ListDetailsPage } from "./ListDetailsPage"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"

type RouteParams = {
  id: string
}

const UserListDetailsPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const listQuery = useUserListsDetail(id)
  const itemsQuery = useInfiniteUserListItems({ userlist_id: id })
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return pages?.flatMap((p) => p.results ?? []) ?? []
  }, [itemsQuery.data])

  return (
    <ListDetailsPage
      listType={ListType.UserList}
      list={listQuery.data}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      handleEdit={() => manageListDialogs.upsertUserList(listQuery.data)}
    />
  )
}

export default UserListDetailsPage
