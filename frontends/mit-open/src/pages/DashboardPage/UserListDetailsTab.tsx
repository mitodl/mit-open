import React, { useMemo } from "react"
import {
  useInfiniteUserListItems,
  useUserListsDetail,
} from "api/hooks/learningResources"
import { ListType } from "api/constants"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import ItemsListingComponent from "@/page-components/ItemsListing/ItemsListingComponent"

interface UserListDetailsTabProps {
  userListId: number
}

const UserListDetailsTab: React.FC<UserListDetailsTabProps> = (props) => {
  const { userListId } = props
  const listQuery = useUserListsDetail(userListId)
  const itemsQuery = useInfiniteUserListItems({ userlist_id: userListId })

  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return pages?.flatMap((p) => p.results ?? []) ?? []
  }, [itemsQuery.data])

  return (
    <ItemsListingComponent
      listType={ListType.UserList}
      list={listQuery.data}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      handleEdit={() => manageListDialogs.upsertUserList(listQuery.data)}
    />
  )
}

export default UserListDetailsTab
