import React, { useCallback, useMemo } from "react"
import {
  Button,
  LoadingSpinner,
  BannerPage,
  Container,
  styled,
  SimpleMenuItem,
  SimpleMenu,
  ActionButton,
  Typography,
  PlainList,
  imgConfigs,
} from "ol-components"
import { RiPencilFill, RiMore2Fill, RiDeleteBin7Fill } from "@remixicon/react"

import { MetaTags } from "ol-utilities"
import type { UserList } from "api"
import { useUserListList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import UserListCardTemplate from "@/page-components/UserListCardTemplate/UserListCardTemplate"
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

type EditUserListMenuProps = {
  userList: UserList
}

const EditUserListMenu: React.FC<EditUserListMenuProps> = ({ userList }) => {
  const items: SimpleMenuItem[] = useMemo(
    () => [
      {
        key: "edit",
        label: "Edit",
        icon: <RiPencilFill />,
        onClick: () => manageListDialogs.upsertUserList(userList),
      },
      {
        key: "delete",
        label: "Delete",
        icon: <RiDeleteBin7Fill />,
        onClick: () => manageListDialogs.destroyUserList(userList),
      },
    ],
    [userList],
  )
  return (
    <SimpleMenu
      trigger={
        <ActionButton
          variant="text"
          color="secondary"
          size="small"
          aria-label={`Edit list ${userList.title}`}
        >
          <RiMore2Fill fontSize="inherit" />
        </ActionButton>
      }
      items={items}
    />
  )
}

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
                    <UserListCardTemplate
                      variant="row-reverse"
                      userList={list}
                      className="ic-resource-card"
                      imgConfig={imgConfigs["row-reverse-small"]}
                      onActivate={onActivate}
                      footerActionSlot={<EditUserListMenu userList={list} />}
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
