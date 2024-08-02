import React, { useCallback, useMemo } from "react"
import {
  Button,
  Grid,
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
  Card,
  theme,
} from "ol-components"
import {
  RiPencilFill,
  RiMore2Fill,
  RiDeleteBin7Fill,
  RiListCheck3,
} from "@remixicon/react"

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

const ListHeaderGrid = styled(Grid)({
  marginBottom: "1rem",
})

const EmptyListCard = styled(Card)`
  margin-top: 16px;
`

const EmptyList = styled.div`
  display: flex;
  padding: 32px;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  text-align: center;
`

const IconContainer = styled.div`
  display: inline-block;
  margin: 0 auto;
  padding: 12px;
  height: 56px;
  border-radius: 4px;
  color: ${theme.custom.colors.silverGrayDark};
  background: ${theme.custom.colors.lightGray1};
  svg {
    width: 32px;
    height: 32px;
  }
`

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
  const { data, isLoading } = useUserListList()
  const handleCreate = useCallback(() => {
    manageListDialogs.upsertUserList()
  }, [])

  return (
    <GridContainer>
      <GridColumn variant="single-full">
        <ListHeaderGrid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h3" component="h1">
              {title}
            </Typography>
          </Grid>
          <Grid
            item
            justifyContent="flex-end"
            alignItems="center"
            display="flex"
          >
            {data?.results.length && !isLoading && (
              <Button variant="primary" onClick={handleCreate}>
                Create new list
              </Button>
            )}
          </Grid>
        </ListHeaderGrid>
        <section>
          <LoadingSpinner loading={isLoading} />

          {!data?.results.length && !isLoading && (
            <EmptyListCard>
              <Card.Content>
                <EmptyList>
                  <IconContainer>
                    <RiListCheck3 />
                  </IconContainer>
                  <Typography variant="body2">
                    Create lists to save your courses and materials.{" "}
                    <Typography variant="subtitle2" component="strong">
                      Create new list
                    </Typography>{" "}
                    to start!
                  </Typography>
                  <Button variant="primary" size="large" onClick={handleCreate}>
                    Create new list
                  </Button>
                </EmptyList>
              </Card.Content>
            </EmptyListCard>
          )}
          {data && (
            <PlainList itemSpacing={3}>
              {data.results?.map((list) => {
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
