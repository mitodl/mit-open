import {
  RiAccountCircleFill,
  RiBookmarkFill,
  RiEditFill,
  RiLayoutMasonryFill,
} from "@remixicon/react"
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Tab,
  TabContext,
  TabPanel,
  Tabs,
  Typography,
  styled,
} from "ol-components"
import { MetaTags } from "ol-utilities"
import React, { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useUserMe } from "api/hooks/user"
import { useLocation } from "react-router"
import { UserListGrid } from "../UserListListingPage/UserListListingPage"
import { UserList } from "api"
import { ListDetailsComponent } from "../ListDetailsPage/ListDetailsPage"
import { ListType } from "api/constants"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import {
  useInfiniteUserListItems,
  useUserListsDetail,
} from "api/hooks/learningResources"

const Background = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.lightGray1,
  backgroundImage: "url('/static/images/user_menu_background.svg')",
  backgroundAttachment: "fixed",
  backgroundRepeat: "no-repeat",
  height: "100%",
}))

const Page = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "40px 84px 80px 84px",
  gap: "80px",
  height: "100%",
})

const DashboardGrid = styled(Grid)({
  display: "grid",
  gridTemplateColumns: "300px 1fr",
  gap: "48px",
})

const ProfileSidebar = styled(Card)({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "300px",
  boxShadow: "-4px 4px 0px 0px #A31F34",
})

const ProfilePhotoContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  padding: "12px 20px",
  gap: "16px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
  background: `linear-gradient(90deg, ${theme.custom.colors.white} 0%, ${theme.custom.colors.lightGray1} 100%)`,
}))

const UserNameContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "8px",
})

const UserIcon = styled(RiAccountCircleFill)(({ theme }) => ({
  width: "64px",
  height: "64px",
  color: theme.custom.colors.black,
}))

const UserNameText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.h5,
}))

const TabsContainer = styled(Tabs)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  textDecoration: "none",
  "& .MuiTabs-indicator": {
    display: "none",
  },
  a: {
    padding: "0",
    opacity: "1",
  },
  "&:hover": {
    a: {
      textDecoration: "none",
    },
  },
  ".user-menu-tab-selected": {
    ".user-menu-link-icon, .user-menu-link-text": {
      color: theme.custom.colors.mitRed,
    },
  },
}))

const TabContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flex: "1 0 0",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "16px 20px",
  gap: "8px",
  width: "300px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray1}`,
  "&:hover": {
    ".user-menu-link-icon, .user-menu-link-text": {
      color: theme.custom.colors.mitRed,
    },
  },
}))

const LinkIconContainer = styled.div(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
}))

const LinkText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
}))

interface UserMenuTabProps {
  icon: React.ReactNode
  text: string
  value: string
  currentValue: string
  onClick?: () => void
}

const UserMenuTab: React.FC<UserMenuTabProps> = (props) => {
  const { icon, text, value, currentValue, onClick } = props
  const selected = value === currentValue
  return (
    <Tab
      component={Link}
      to={`#${value}`}
      label={
        <TabContainer
          onClick={onClick}
          className={selected ? "user-menu-tab-selected" : ""}
        >
          <LinkIconContainer className="user-menu-link-icon">
            {icon}
          </LinkIconContainer>
          <LinkText className="user-menu-link-text">{text}</LinkText>
        </TabContainer>
      }
    ></Tab>
  )
}

enum TabValues {
  HOME = "home",
  MY_LISTS = "my-lists",
  PROFILE = "profile",
}

const keyFromHash = (hash: string) => {
  const keys = [TabValues.HOME, TabValues.MY_LISTS, TabValues.PROFILE]
  const match = keys.find((key) => `#${key}` === hash)
  return match ?? "home"
}

interface UserListDetailsTabProps {
  userListId: number
}

const UserListDetailsTab: React.FC<UserListDetailsTabProps> = (props) => {
  const { userListId } = props
  const pathQuery = useUserListsDetail(userListId)
  const itemsQuery = useInfiniteUserListItems({ userlist_id: userListId })
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return pages?.flatMap((p) => p.results ?? []) ?? []
  }, [itemsQuery.data])
  return (
    <ListDetailsComponent
      listType={ListType.UserList}
      title={pathQuery?.data?.title}
      description={pathQuery.data?.description}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      handleEdit={() => manageListDialogs.upsertUserList(pathQuery.data)}
    />
  )
}

const DashboardPage: React.FC = () => {
  const { isLoading, data: user } = useUserMe()
  const { hash } = useLocation()
  const tabValue = keyFromHash(hash)
  const [userListAction, setUserListAction] = useState("list")
  const [userListId, setUserListId] = useState(0)

  const handleActivateUserList = useCallback((userList: UserList) => {
    setUserListId(userList.id)
    setUserListAction("detail")
  }, [])

  return (
    <Background>
      <Page>
        <Container>
          <MetaTags>
            <title>User Home</title>
          </MetaTags>
          <DashboardGrid container>
            <TabContext value={tabValue}>
              <Grid item>
                <ProfileSidebar>
                  <ProfilePhotoContainer>
                    <UserIcon />
                    <UserNameContainer>
                      {isLoading ? (
                        <Skeleton variant="text" width={128} height={32} />
                      ) : (
                        <UserNameText>{`${user?.first_name} ${user?.last_name}`}</UserNameText>
                      )}
                    </UserNameContainer>
                  </ProfilePhotoContainer>
                  <TabsContainer value={tabValue} orientation="vertical">
                    <UserMenuTab
                      icon={<RiLayoutMasonryFill />}
                      text="Home"
                      value={TabValues.HOME}
                      currentValue={tabValue}
                    />
                    <UserMenuTab
                      icon={<RiBookmarkFill />}
                      text="My Lists"
                      value={TabValues.MY_LISTS}
                      currentValue={tabValue}
                      onClick={() => setUserListAction("list")}
                    />
                    <UserMenuTab
                      icon={<RiEditFill />}
                      text="Profile"
                      value={TabValues.PROFILE}
                      currentValue={tabValue}
                    />
                  </TabsContainer>
                </ProfileSidebar>
              </Grid>
              <Grid item>
                <TabPanel value="home">
                  <Typography variant="h3">
                    Your MIT Learning journey
                  </Typography>
                  <Typography variant="body1">Coming soon...</Typography>
                </TabPanel>
                <TabPanel value={TabValues.MY_LISTS}>
                  {userListAction === "list" ? (
                    <div id="user-list-listing">
                      <UserListGrid onActivate={handleActivateUserList} />
                    </div>
                  ) : (
                    <div id="user-list-detail">
                      <UserListDetailsTab userListId={userListId} />
                    </div>
                  )}
                </TabPanel>
                <TabPanel value={TabValues.PROFILE}>
                  <Typography variant="h3">Profile</Typography>
                  <Typography variant="body1">Coming soon...</Typography>
                </TabPanel>
              </Grid>
            </TabContext>
          </DashboardGrid>
        </Container>
      </Page>
    </Background>
  )
}

export default DashboardPage
