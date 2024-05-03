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
  IconButton,
  Typography,
  PlainList,
} from "ol-components"
import EditIcon from "@mui/icons-material/Edit"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import DeleteIcon from "@mui/icons-material/Delete"

import { MetaTags } from "ol-utilities"
import type { UserList } from "api"
import { useUserListList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import UserListCardTemplate from "@/page-components/UserListCardTemplate/UserListCardTemplate"
import { useNavigate } from "react-router"
import * as urls from "@/common/urls"
import { imgConfigs } from "@/common/constants"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"

const ListHeaderGrid = styled(Grid)`
  margin-top: 1rem;
  margin-bottom: 1rem;
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
        icon: <EditIcon />,
        onClick: () => manageListDialogs.upsertUserList(userList),
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteIcon />,
        onClick: () => manageListDialogs.destroyUserList(userList),
      },
    ],
    [userList],
  )
  return (
    <SimpleMenu
      trigger={
        <IconButton size="small" aria-label={`Edit list ${userList.title}`}>
          <MoreVertIcon fontSize="inherit" />
        </IconButton>
      }
      items={items}
    />
  )
}

type ListCardProps = {
  list: UserList
  onActivate: (userList: UserList) => void
  canEdit: boolean
}
const ListCard: React.FC<ListCardProps> = ({ list, onActivate }) => {
  return (
    <UserListCardTemplate
      variant="row-reverse"
      userList={list}
      className="ic-resource-card"
      imgConfig={imgConfigs["row-reverse-small"]}
      onActivate={onActivate}
      footerActionSlot={<EditUserListMenu userList={list} />}
    />
  )
}

const UserListListingPage: React.FC = () => {
  const listingQuery = useUserListList()

  const navigate = useNavigate()
  const handleActivate = useCallback(
    (userList: UserList) => {
      const path = urls.userListView(userList.id)
      navigate(path)
    },
    [navigate],
  )
  const handleCreate = useCallback(() => {
    manageListDialogs.upsertUserList()
  }, [])

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      className="learningpaths-page"
    >
      <MetaTags>
        <title>User Lists</title>
      </MetaTags>
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full">
            <ListHeaderGrid container justifyContent="space-between">
              <Grid item>
                <Typography variant="h3" component="h1">
                  User Lists
                </Typography>
              </Grid>
              <Grid
                item
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
              >
                <Button variant="filled" onClick={handleCreate}>
                  Create new list
                </Button>
              </Grid>
            </ListHeaderGrid>
            <section>
              <LoadingSpinner loading={listingQuery.isLoading} />
              {listingQuery.data && (
                <PlainList itemSpacing={3}>
                  {listingQuery.data.results?.map((list) => {
                    return (
                      <li key={list.id}>
                        <ListCard
                          list={list}
                          onActivate={handleActivate}
                          canEdit={true}
                        />
                      </li>
                    )
                  })}
                </PlainList>
              )}
            </section>
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default UserListListingPage
