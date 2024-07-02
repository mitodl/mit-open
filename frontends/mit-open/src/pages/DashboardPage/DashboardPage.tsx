import {
  RiAccountCircleFill,
  RiBookmarkFill,
  RiEditFill,
  RiLayoutMasonryFill,
} from "@remixicon/react"
import {
  ButtonLink,
  Card,
  Container,
  Skeleton,
  Tab,
  TabButtonLink,
  TabButtonList,
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
import { UserListListingComponent } from "../UserListListingPage/UserListListingPage"
import {
  UserList,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest,
} from "api"
import {
  useInfiniteUserListItems,
  useUserListsDetail,
  useLearningResourcesSearch,
} from "api/hooks/learningResources"
import { ListDetailsComponent } from "../ListDetailsPage/ListDetailsPage"
import { ListType } from "api/constants"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { ProfileEditForm } from "./ProfileEditForm"
import { useProfileMeQuery } from "api/hooks/profile"
import {
  TopPicksCarouselConfig,
  TopicCarouselConfig,
  NEW_LEARNING_RESOURCES_CAROUSEL,
  POPULAR_LEARNING_RESOURCES_CAROUSEL,
  CERTIFICATE_COURSES_CAROUSEL,
  FREE_COURSES_CAROUSEL,
} from "./carousels"
import ResourceCarousel from "@/page-components/ResourceCarousel/ResourceCarousel"

/**
 *
 * The desktop and mobile layouts are significantly different, so we use the
 * `MobileOnly` and `DesktopOnly` components to conditionally render the
 * appropriate layout based on the screen size.
 *
 * **/

const MobileOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}))

const DesktopOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const Background = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.lightGray1,
  backgroundImage: "url('/static/images/user_menu_background.svg')",
  backgroundAttachment: "fixed",
  backgroundRepeat: "no-repeat",
  height: "100%",
  [theme.breakpoints.down("md")]: {
    backgroundImage: "none",
  },
}))

const Page = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "40px 84px 80px 84px",
  gap: "80px",
  height: "100%",
  [theme.breakpoints.down("md")]: {
    padding: "0",
    gap: "24px",
  },
}))

const DashboardContainer = styled(Container)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    padding: "24px 16px",
    gap: "24px",
  },
}))

const DashboardGrid = styled.div(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr)",
  gap: "48px",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "24px",
  },
}))

const DashboardGridItem = styled.div({
  display: "flex",
  "> *": {
    minWidth: "0px",
  },
})

const ProfileSidebar = styled(Card)(({ theme }) => ({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "300px",
  boxShadow: "-4px 4px 0px 0px #A31F34",
  [theme.breakpoints.down("md")]: {
    position: "relative",
  },
}))

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

const TabPanelStyled = styled(TabPanel)({
  padding: "0",
  width: "100%",
})

const TitleText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  ...theme.typography.h3,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.h5,
  },
}))

const SubTitleText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body1,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.subtitle3,
  },
}))

const HomeHeader = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  [theme.breakpoints.down("md")]: {
    paddingBottom: "8px",
  },
}))

const HomeHeaderLeft = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  flex: "1 0 0",
})

const HomeHeaderRight = styled.div(({ theme }) => ({
  display: "flex",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const CarouselContainer = styled.div(({ theme }) => ({
  padding: "40px 0",
  [theme.breakpoints.down("md")]: {
    padding: "16px 0",
  },
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
      data-testid={`desktop-tab-${value}`}
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

const TabLabels = {
  [TabValues.HOME.toString()]: "Home",
  [TabValues.MY_LISTS.toString()]: "My Lists",
  [TabValues.PROFILE.toString()]: "Profile",
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

const TopPicksCarousel: React.FC = () => {
  const { isLoading: isLoadingProfile, data: profile } = useProfileMeQuery()
  const config = TopPicksCarouselConfig(profile)
  const { data, isLoading } = useLearningResourcesSearch(
    config[0].data
      .params as LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest,
  )

  if (!isLoading && !data?.results?.length) {
    return null
  }
  return (
    <CarouselContainer data-testid="top-picks-carousel">
      <ResourceCarousel
        title="Top picks for you"
        isLoading={isLoadingProfile}
        config={config}
      />
    </CarouselContainer>
  )
}

const DashboardPage: React.FC = () => {
  const { isLoading: isLoadingUser, data: user } = useUserMe()
  const { isLoading: isLoadingProfile, data: profile } = useProfileMeQuery()
  const { hash } = useLocation()
  const tabValue = keyFromHash(hash)
  const [userListAction, setUserListAction] = useState("list")
  const [userListId, setUserListId] = useState(0)

  const topics = profile?.preference_search_filters.topic
  const certification = profile?.preference_search_filters.certification

  const handleActivateUserList = useCallback((userList: UserList) => {
    setUserListId(userList.id)
    setUserListAction("detail")
  }, [])

  const desktopMenu = (
    <ProfileSidebar>
      <Card.Content>
        <ProfilePhotoContainer>
          <UserIcon />
          <UserNameContainer>
            {isLoadingUser ? (
              <Skeleton variant="text" width={128} height={32} />
            ) : (
              <UserNameText>{`${user?.first_name} ${user?.last_name}`}</UserNameText>
            )}
          </UserNameContainer>
        </ProfilePhotoContainer>
        <TabsContainer
          value={tabValue}
          orientation="vertical"
          data-testid="desktop-tab-list"
        >
          <UserMenuTab
            icon={<RiLayoutMasonryFill />}
            text={TabLabels[TabValues.HOME]}
            value={TabValues.HOME}
            currentValue={tabValue}
          />
          <UserMenuTab
            icon={<RiBookmarkFill />}
            text={TabLabels[TabValues.MY_LISTS]}
            value={TabValues.MY_LISTS}
            currentValue={tabValue}
            onClick={() => setUserListAction("list")}
          />
          <UserMenuTab
            icon={<RiEditFill />}
            text={TabLabels[TabValues.PROFILE]}
            value={TabValues.PROFILE}
            currentValue={tabValue}
          />
        </TabsContainer>
      </Card.Content>
    </ProfileSidebar>
  )

  const mobileMenu = (
    <TabButtonList data-testid="mobile-tab-list">
      <TabButtonLink
        data-testid={`mobile-tab-${TabValues.HOME}`}
        value={TabValues.HOME}
        href={`#${TabValues.HOME}`}
        label="Home"
      />
      <TabButtonLink
        data-testid={`mobile-tab-${TabValues.MY_LISTS}`}
        value={TabValues.MY_LISTS}
        href={`#${TabValues.MY_LISTS}`}
        label="My Lists"
        onClick={() => setUserListAction("list")}
      />
      <TabButtonLink
        data-testid={`mobile-tab-${TabValues.PROFILE}`}
        value={TabValues.PROFILE}
        href={`#${TabValues.PROFILE}`}
        label="Profile"
      />
    </TabButtonList>
  )

  return (
    <Background>
      <Page>
        <DashboardContainer>
          <MetaTags title="Your MIT Learning Journey" />
          <TabContext value={tabValue}>
            <DashboardGrid>
              <DashboardGridItem>
                <MobileOnly>{mobileMenu}</MobileOnly>
                <DesktopOnly>{desktopMenu}</DesktopOnly>
              </DashboardGridItem>
              <DashboardGridItem>
                <TabPanelStyled value={TabValues.HOME}>
                  <HomeHeader>
                    <HomeHeaderLeft>
                      <TitleText role="heading">
                        Your MIT Learning Journey
                      </TitleText>
                      <SubTitleText>
                        A customized course list based on your preferences.
                      </SubTitleText>
                    </HomeHeaderLeft>
                    <HomeHeaderRight>
                      <ButtonLink
                        variant="tertiary"
                        href={`#${TabValues.PROFILE}`}
                      >
                        Edit Profile
                      </ButtonLink>
                    </HomeHeaderRight>
                  </HomeHeader>
                  <TopPicksCarousel />
                  {topics?.map((topic) => (
                    <CarouselContainer
                      key={topic}
                      data-testid={`topic-carousel-${topic}`}
                    >
                      <ResourceCarousel
                        title={`Popular courses in ${topic}`}
                        isLoading={isLoadingProfile}
                        config={TopicCarouselConfig(topic)}
                      />
                    </CarouselContainer>
                  ))}
                  {certification === true ? (
                    <CarouselContainer data-testid="certification-carousel">
                      <ResourceCarousel
                        title={"Courses with Certificates"}
                        isLoading={isLoadingProfile}
                        config={CERTIFICATE_COURSES_CAROUSEL}
                      />
                    </CarouselContainer>
                  ) : (
                    <CarouselContainer data-testid="free-carousel">
                      <ResourceCarousel
                        title={"Free courses"}
                        isLoading={isLoadingProfile}
                        config={FREE_COURSES_CAROUSEL}
                      />
                    </CarouselContainer>
                  )}
                  <CarouselContainer data-testid="new-learning-resources-carousel">
                    <ResourceCarousel
                      title="New"
                      config={NEW_LEARNING_RESOURCES_CAROUSEL}
                    />
                  </CarouselContainer>
                  <CarouselContainer data-testid="popular-learning-resources-carousel">
                    <ResourceCarousel
                      title="Popular"
                      config={POPULAR_LEARNING_RESOURCES_CAROUSEL}
                    />
                  </CarouselContainer>
                </TabPanelStyled>
                <TabPanelStyled value={TabValues.MY_LISTS}>
                  {userListAction === "list" ? (
                    <div id="user-list-listing">
                      <UserListListingComponent
                        title="My Lists"
                        onActivate={handleActivateUserList}
                      />
                    </div>
                  ) : (
                    <div id="user-list-detail">
                      <UserListDetailsTab userListId={userListId} />
                    </div>
                  )}
                </TabPanelStyled>
                <TabPanelStyled
                  key={TabValues.PROFILE}
                  value={TabValues.PROFILE}
                >
                  <TitleText role="heading">Profile</TitleText>
                  {isLoadingProfile || typeof profile === "undefined" ? (
                    <Skeleton variant="text" width={128} height={32} />
                  ) : (
                    <div id="user-profile-edit">
                      <ProfileEditForm profile={profile} />
                    </div>
                  )}
                </TabPanelStyled>
              </DashboardGridItem>
            </DashboardGrid>
          </TabContext>
        </DashboardContainer>
      </Page>
    </Background>
  )
}

export { DashboardPage, TabLabels as DashboardTabLabels }
