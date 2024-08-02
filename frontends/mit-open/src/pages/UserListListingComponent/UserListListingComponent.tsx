import React, { useCallback } from "react"
import {
  Button,
  LoadingSpinner,
  styled,
  Typography,
  PlainList,
} from "ol-components"

import { useUserListList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { userListView } from "@/common/urls"
import UserListCardCondensed from "@/page-components/UserListCard/UserListCardCondensed"

const Header = styled(Typography)({
  marginBottom: "16px",
})

const NewListButton = styled(Button)({
  marginTop: "24px",
  width: "200px",
})

type UserListListingComponentProps = {
  title?: string
}

const UserListListingComponent: React.FC<UserListListingComponentProps> = (
  props,
) => {
  const { title } = props
  const listingQuery = useUserListList()
  const handleCreate = useCallback(() => {
    manageListDialogs.upsertUserList()
  }, [])

  return (
    <GridContainer>
      <GridColumn variant="single-full">
        <Header variant="h3">{title}</Header>
        <section>
          <LoadingSpinner loading={listingQuery.isLoading} />
          {listingQuery.data && (
            <PlainList itemSpacing={3}>
              {listingQuery.data.results?.map((list) => {
                return (
                  <li
                    key={list.id}
                    data-testid={`user-list-card-condensed-${list.id}`}
                  >
                    <UserListCardCondensed
                      href={userListView(list.id)}
                      userList={list}
                    />
                  </li>
                )
              })}
            </PlainList>
          )}
          <NewListButton variant="primary" onClick={handleCreate}>
            Create new list
          </NewListButton>
        </section>
      </GridColumn>
    </GridContainer>
  )
}

export default UserListListingComponent
