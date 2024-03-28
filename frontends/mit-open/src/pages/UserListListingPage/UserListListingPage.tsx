import React, { useCallback } from "react"
import {
  Button,
  Grid,
  LoadingSpinner,
  BannerPage,
  Container,
  styled,
} from "ol-components"

import { MetaTags } from "ol-utilities"
import type { UserList } from "api"
import { useUserListList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import CardRowList from "@/components/CardRowList/CardRowList"
import UserListCardTemplate from "@/page-components/UserListCardTemplate/UserListCardTemplate"
import { useNavigate } from "react-router"
import * as urls from "@/common/urls"

const ListHeaderGrid = styled(Grid)`
  margin-top: 1rem;
  margin-bottom: 1rem;
`

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
      onActivate={onActivate}
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
                <h1>User Lists</h1>
              </Grid>
              <Grid
                item
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
              >
                <Button variant="contained">Create new list</Button>
              </Grid>
            </ListHeaderGrid>
            <section>
              <LoadingSpinner loading={listingQuery.isLoading} />
              {listingQuery.data && (
                <CardRowList>
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
                </CardRowList>
              )}
            </section>
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default UserListListingPage
