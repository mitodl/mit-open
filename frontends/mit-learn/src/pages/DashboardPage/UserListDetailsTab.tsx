import React, { useMemo } from "react"
import {
  useInfiniteUserListItems,
  useUserListsDetail,
} from "api/hooks/learningResources"
import { useNavigate } from "react-router"
import { ListType } from "api/constants"
import { useUserMe } from "api/hooks/user"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import ItemsListingComponent from "@/page-components/ItemsListing/ItemsListingComponent"

interface UserListDetailsTabProps {
  userListId: number
}

const UserListDetailsTab: React.FC<UserListDetailsTabProps> = (props) => {
  const { userListId } = props

  const { data: user } = useUserMe()
  const listQuery = useUserListsDetail(userListId)
  const itemsQuery = useInfiniteUserListItems({ userlist_id: userListId })
  const navigate = useNavigate()

  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return pages?.flatMap((p) => p.results ?? []) ?? []
  }, [itemsQuery.data])

  const onDestroyUserList = () => {
    navigate("/dashboard/my-lists")
  }

  return (
    <ItemsListingComponent
      listType={ListType.UserList}
      list={listQuery.data}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      showSort={!!user?.is_authenticated}
      canEdit={!!user?.is_authenticated}
      handleEdit={() =>
        manageListDialogs.upsertUserList(listQuery.data, onDestroyUserList)
      }
      condensed
    />
  )
}

export default UserListDetailsTab
