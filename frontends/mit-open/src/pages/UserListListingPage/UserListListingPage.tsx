import React, { useCallback } from "react"
import {
  Button,
  LoadingSpinner,
  BannerPage,
  Container,
  styled,
  Typography,
  PlainList,
  UserListCardCondensed,
} from "ol-components"

import { MetaTags } from "ol-utilities"
import type { UserList } from "api"
import { useUserListList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import { useNavigate } from "react-router"
import * as urls from "@/common/urls"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"

const PageContainer = styled(Container)({
  marginTop: "1rem",
})

const Header = styled(Typography)({
  marginBottom: "16px",
})

const NewListButton = styled(Button)({
  marginTop: "24px",
  width: "200px",
})

type UserListListingComponentProps = {
  title?: string
  onActivate: (userList: UserList) => void
}

const UserListListingComponent: React.FC<UserListListingComponentProps> = (
  props,
) => {
  const { title, onActivate } = props
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
                  <li key={list.id}>
                    <UserListCardCondensed
                      userList={list}
                      onActivate={onActivate}
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

const UserListListingPage: React.FC = () => {
  const navigate = useNavigate()
  const handleActivate = useCallback(
    (userList: UserList) => {
      const path = urls.userListView(userList.id)
      navigate(path)
    },
    [navigate],
  )
  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      className="learningpaths-page"
    >
      <MetaTags title="My Lists" />
      <PageContainer maxWidth="sm">
        <UserListListingComponent
          title="User Lists"
          onActivate={handleActivate}
        />
      </PageContainer>
    </BannerPage>
  )
}

export { UserListListingComponent, UserListListingPage }
